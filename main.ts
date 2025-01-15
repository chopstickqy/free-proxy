import axios from 'axios';
import * as fs from 'fs';
import simpleGit from 'simple-git';

const API_URL = 'http://proxydb.net/list'; // 更新为获取代理数据的接口
const git = simpleGit();

// // 测试代理的可用性
// async function testProxy(proxy: { host: string; port: number }): Promise<boolean> {
//     const url = 'https://httpbin.org/ip'; // 测试用的 URL，可以替换为其他可用的 URL
//     try {
//         const response = await axios.get(url, {
//             proxy: {
//                 host: proxy.host,
//                 port: proxy.port,
//                 protocol: 'http',
//             },
//             timeout: 5000, // 设置超时时间
//         });
//         console.log(`代理 ${proxy.host}:${proxy.port} 可用，响应:`, response.data);
//         return true; // 代理可用
//     } catch (error) {
//         console.error(`代理 ${proxy.host}:${proxy.port} 不可用:`, error.message);
//         return false; // 代理不可用
//     }
// }

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
            // const isAvailable = await testProxy({ host: proxy.ip, port: proxy.port });
            // if (isAvailable) {
                // @ts-ignore
                filteredProxies.push({
                    id: proxy.id,
                    ip: proxy.ip,
                    port: proxy.port,
                    country: proxy.cname,
                    city: proxy.city,
                });
            // }
        }

        // 将整理后的可用代理数据保存到 proxy.json 文件中
        fs.writeFileSync('proxy.json', JSON.stringify(filteredProxies, null, 2));
        console.log('整理后的可用代理数据已保存到 proxy.json');

        // Git 操作：推送到 proxy 分支
        await pushToGitHub();
    } catch (error) {
        console.error('获取代理数据时出错:', error);
    }
}

async function pushToGitHub() {
    const accessToken = process.env.ACCESS_TOKEN; // 从环境变量获取访问令牌
    const repoUrl = `https://${accessToken}:x-oauth-basic@github.com/chopstickqy/free-proxy.git`;
    const branchName = 'proxy';

    // 初始化 Git
    await git.init();
    await git.add('./proxy.json');

    // 检查分支是否存在
    const branches = await git.branch();
    if (!branches.all.includes(branchName)) {
        await git.checkoutLocalBranch(branchName); // 创建并切换到新分支
    } else {
        await git.checkout(branchName); // 切换到已存在的分支
    }

    // 拉取远程分支的最新更改
    await git.pull('origin', branchName)

    // 提交更改
    await git.commit('Update proxy.json with available proxies');

    // 检查远程仓库是否已存在
    const remotes = await git.getRemotes();
    if (!remotes.some(remote => remote.name === 'origin')) {
        // 设置远程仓库
        await git.addRemote('origin', repoUrl);
    }

    // 推送到远程仓库
    await git.push('origin', branchName, { '--set-upstream': null });
    console.log(`已将 proxy.json 推送到 ${repoUrl} 的 ${branchName} 分支`);
}

fetchProxyData();