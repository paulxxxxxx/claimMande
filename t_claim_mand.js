import axios from 'axios';
import fs from 'fs';
import fss from 'fs/promises'

const MAX_RETRIES = 3; // 最大重试次数

async function sleep(min, max) {
    const randomTime = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, randomTime));
  }

async function processAddresses(filePath) {
    try {
        const ADDRESS = await fss.readFile(filePath, 'utf8');
        // 使用 split('\n') 替代正则表达式来拆分行
        const lines = ADDRESS.split(/\r?\n|\r/g);
        // 如果最后一行是空行，则去掉
        if (lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        const addList = lines.map((line) => {
            // 使用 split(':') 来获取冒号前的部分
            return line.split(':')[0]//.trim();
        });
        console.log(addList);
        return addList
        
    } catch (err) {
        console.error('读取文件时出错：', err);
    }
}

//本脚本无需私钥签名
async function main() {
    try {
        const addresses = await processAddresses('./XXXXX.txt');//----------->>>>>修改为自己存放领取地址的本地文件,每个0x地址一行
        const headers = {
            'accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'origin': 'https://rolldrop.mande.network',
            'referer': 'https://rolldrop.mande.network/',
            //'user-agent': userAgent,
        };

        for (const address of addresses) {
            let isSuccess = false; // 标记是否成功领取
            for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
                try {
                    const url = "https://claimaddressrequest-pubtg5k4sq-uc.a.run.app/";
                    const payload = {address:address};
                    const response = await axios.post(url, payload, { headers: headers });
                    console.log(`地址: ${address}, 领取数量:${response.data.amount}, 领取状态:${response.data.claimed}`);
                    isSuccess = true; // 标记为成功领取
                    await sleep(3000, 5000); // 随机等待3到7秒
                    break; // 成功后退出循环
                } catch (error) {
                    console.error(`领取失败，地址：${address}: ${error.message}`);
                    if (attempts === MAX_RETRIES - 1) {
                        console.log('达到最大重试次数，记录地址并继续下一个地址');
                        await fss.appendFile('log_mand.txt', address + '\n'); // 在最大重试次数后记录地址, 注意修改日志文件
                    } else {
                        await sleep(5000,6000); // 随机等待重试
                    }
                }
            }
        }
    } catch (error) {
        console.error('发生错误:', error);
    }
}

main();

//浏览器响应内容如下
// {
//     "amount": 2.512495068,
//     "address": "0x....",
//     "lowerCaseAddress": "0x....",
//     "weight": 4.472150489,
//     "claimed": true,
//     "key": "0。。。。I"
// }
