import axios from 'axios';
import * as fs from 'fs';

const API_URL = 'http://proxydb.net/list'; // 更新为获取代理数据的接口

async function fetchProxyData() {
    try {
        const response = await axios.post(API_URL, {
            protocols: ["https"],
            anonlvls: [4],
            offset: 0
        }, {
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        });

        const proxyData = response.data.proxies; // 获取代理数据数组

        // 过滤并整理数据
        const filteredProxies = [];
        for (const proxy of proxyData) {
                // @ts-ignore
                filteredProxies.push({
                    id: proxy.id,
                    ip: proxy.ip,
                    port: proxy.port,
                    country: proxy.cname,
                    city: proxy.city,
                });
        }

        // 将整理后的可用代理数据保存到 proxy.json 文件中
        fs.writeFileSync('proxy.json', JSON.stringify(filteredProxies, null, 2));
        console.log('整理后的可用代理数据已保存到 proxy.json');

    } catch (error) {
        console.error('获取代理数据时出错:', error);
    }
}

fetchProxyData();