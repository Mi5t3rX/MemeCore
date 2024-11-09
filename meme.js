const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class MemesWar {
    constructor() {
        this.headers = {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "referer": "https://memes-war.memecore.com/",
            "sec-ch-ua": '"Chromium";v="130", "Not?A_Brand";v="99"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
        };        
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [✓] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [✗] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [!] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Wait ${i} sec to continue...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async getUserInfo(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/user";
        const headers = { 
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.data) {
                const { honorPoints, warbondTokens, honorPointRank } = response.data.data.user;
                return { success: true, data: { honorPoints, warbondTokens, honorPointRank } };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async checkTreasuryRewards(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/quest/treasury/rewards";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async claimTreasuryRewards(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/quest/treasury";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processTreasury(telegramInitData) {
        const checkResult = await this.checkTreasuryRewards(telegramInitData);
        if (!checkResult.success) {
            this.log(`Cannot check $War.Bond: ${checkResult.error}`, 'error');
            return;
        }

        const { leftSecondsUntilTreasury, rewards } = checkResult.data;
        
        if (leftSecondsUntilTreasury === 0) {
            this.log('Claiming $War.Bond...', 'info');
            const claimResult = await this.claimTreasuryRewards(telegramInitData);
            
            if (claimResult.success) {
                const rewardAmount = claimResult.data.rewards[0].rewardAmount;
                this.log(`Claim successful ${rewardAmount} $War.Bond`, 'success');
                this.log(`Time to wait for the next claim: ${claimResult.data.leftSecondsUntilTreasury} seconds`, 'info');
            } else {
                this.log(`Unable to claim $War.Bond: ${claimResult.error}`, 'error');
            }
        } else {
            this.log(`It’s not time to claim yet $War.Bond (còn ${leftSecondsUntilTreasury} seconds)`, 'warning');
        }
    }

    async checkCheckInStatus(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/quest/check-in";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async performCheckIn(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/quest/check-in";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processCheckIn(telegramInitData) {
        const checkResult = await this.checkCheckInStatus(telegramInitData);
        if (!checkResult.success) {
            this.log(`Unable to check attendance status: ${checkResult.error}`, 'error');
            return;
        }

        const { checkInRewards } = checkResult.data;
        const claimableReward = checkInRewards.find(reward => reward.status === 'CLAIMABLE');

        if (claimableReward) {
            this.log('Checking attendance..', 'info');
            const checkInResult = await this.performCheckIn(telegramInitData);
            
            if (checkInResult.success) {
                const { currentConsecutiveCheckIn, rewards } = checkInResult.data;
                const rewardText = rewards.map(reward => {
                    if (reward.rewardType === 'WARBOND') {
                        return `${reward.rewardAmount} $War.Bond`;
                    } else if (reward.rewardType === 'HONOR_POINT') {
                        return `${reward.rewardAmount} Honor Points`;
                    }
                    return `${reward.rewardAmount} ${reward.rewardType}`;
                }).join(' + ');
                
                this.log(`Attendance successfully marked for today. ${currentConsecutiveCheckIn} | Reward ${rewardText}`, 'success');
            } else {
                this.log(`Attendance failed: ${checkInResult.error}`, 'error');
            }
        } else {
            this.log('You have checked in today.', 'warning');
        }
    }

    async checkGuildStatus(telegramInitData, guildId) {
        const url = `https://memes-war.memecore.com/api/guild/${guildId}`;
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async checkFavoriteGuilds(telegramInitData) {
        const url = "https://memes-war.memecore.com/api/guild/list/favorite?start=0&count=10";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async favoriteGuild(telegramInitData, guildId) {
        const url = "https://memes-war.memecore.com/api/guild/favorite";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.post(url, { guildId }, { headers });
            if (response.status === 200) {
                return { success: true };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async transferWarbondToGuild(telegramInitData, guildId, warbondCount) {
        const url = "https://memes-war.memecore.com/api/guild/warbond";
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };

        try {
            const response = await axios.post(url, { guildId, warbondCount }, { headers });
            if (response.status === 200) {
                return { success: true };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processGuildOperations(telegramInitData) {
        const TARGET_GUILD_ID = "ec0e0804-a2cd-4800-9f5f-631cea84f749";
        const MIN_WARBOND_THRESHOLD = 1000;

        const userInfoResult = await this.getUserInfo(telegramInitData);
        if (!userInfoResult.success) {
            this.log(`Cannot retrieve user information: ${userInfoResult.error}`, 'error');
            return;
        }

        const warbondTokens = parseInt(userInfoResult.data.warbondTokens);
        if (warbondTokens <= MIN_WARBOND_THRESHOLD) {
            this.log(`Balance $War.Bond (${warbondTokens}) Not enough to transfer`, 'warning');
            return;
        }

        const guildStatus = await this.checkGuildStatus(telegramInitData, TARGET_GUILD_ID);
        if (guildStatus.success) {
            this.log(`Guild ${guildStatus.data.name}: ${guildStatus.data.warbondTokens} $War.Bond`, 'custom');
        }

        const favoriteGuilds = await this.checkFavoriteGuilds(telegramInitData);
        if (favoriteGuilds.success) {
            const isGuildFavorited = favoriteGuilds.data.guilds.some(guild => guild.guildId === TARGET_GUILD_ID);
            if (!isGuildFavorited) {
                this.log('Adding guild to favorites...', 'info');
                await this.favoriteGuild(telegramInitData, TARGET_GUILD_ID);
            }
        }

        this.log(`Transfer ${warbondTokens} $War.Bond Join the guild...`, 'info');
        const transferResult = await this.transferWarbondToGuild(telegramInitData, TARGET_GUILD_ID, warbondTokens.toString());
        if (transferResult.success) {
            this.log(`Transfer ${warbondTokens} $War.Bond Successful`, 'success');
        } else {
            this.log(`Cannot transfer $War.Bond: ${transferResult.error}`, 'error');
        }
    }

    async getQuests(telegramInitData) {
        try {
            const [dailyResponse, singleResponse] = await Promise.all([
                axios.get("https://memes-war.memecore.com/api/quest/daily/list", {
                    headers: { ...this.headers, "cookie": `telegramInitData=${telegramInitData}` }
                }),
                axios.get("https://memes-war.memecore.com/api/quest/single/list", {
                    headers: { ...this.headers, "cookie": `telegramInitData=${telegramInitData}` }
                })
            ]);
    
            if (dailyResponse.status === 200 && singleResponse.status === 200) {
                const dailyQuests = dailyResponse.data.data.quests.map(quest => ({ ...quest, questType: 'daily' }));
                const singleQuests = singleResponse.data.data.quests.map(quest => ({ ...quest, questType: 'single' }));
                
                return { success: true, data: [...dailyQuests, ...singleQuests] };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async submitQuestProgress(telegramInitData, questType, questId) {
        const url = `https://memes-war.memecore.com/api/quest/${questType}/${questId}/progress`;
        const headers = {
            ...this.headers,
            "cookie": `telegramInitData=${telegramInitData}`
        };
    
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200 && response.data.data) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async processQuests(telegramInitData) {
        const questsResult = await this.getQuests(telegramInitData);
        if (!questsResult.success) {
            this.log(`Cannot retrieve the task list: ${questsResult.error}`, 'error');
            return;
        }
    
        const pendingQuests = questsResult.data.filter(quest => quest.status === 'GO');
        if (pendingQuests.length === 0) {
            this.log('No tasks to complete', 'warning');
            return;
        }
    
        for (const quest of pendingQuests) {
            this.log(`Doing the task ${quest.title}`, 'info');

            let result = await this.submitQuestProgress(telegramInitData, quest.questType, quest.id);
            if (!result.success || result.data.status !== 'VERIFY') {
                this.log(`Cannot complete the task ${quest.title}: ${result.error || 'Invalid status'}`, 'error');
                continue;
            }
    

            await this.countdown(3);

            result = await this.submitQuestProgress(telegramInitData, quest.questType, quest.id);
            if (!result.success || result.data.status !== 'CLAIM') {
                this.log(`Cannot complete the task ${quest.title}: ${result.error || 'Invalid status'}`, 'error');
                continue;
            }
    

            await this.countdown(3);
    

            result = await this.submitQuestProgress(telegramInitData, quest.questType, quest.id);
            if (!result.success || result.data.status !== 'DONE') {
                this.log(`Cannot complete the task ${quest.title}: ${result.error || 'Invalid status'}`, 'error');
                continue;
            }

            const rewards = result.data.rewards.map(reward => {
                if (reward.rewardType === 'WARBOND') {
                    return `${reward.rewardAmount} $War.Bond`;
                }
                return `${reward.rewardAmount} ${reward.rewardType}`;
            }).join(' + ');
    
            this.log(`Do the task ${quest.title} Success | Reward: ${rewards}`, 'success');
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            for (let i = 0; i < data.length; i++) {
                const telegramInitData = data[i];
                const userData = JSON.parse(decodeURIComponent(telegramInitData.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;

                console.log(`_______________ Account ${i + 1} | ${firstName.green} _______________`);
                
                const userInfoResult = await this.getUserInfo(telegramInitData);
                if (userInfoResult.success) {
                    const { honorPoints, warbondTokens, honorPointRank } = userInfoResult.data;
                    this.log(`Honor Points: ${honorPoints}`, 'success');
                    this.log(`Warbond Tokens: ${warbondTokens}`, 'success');
                    this.log(`Honor Point Rank: ${honorPointRank}`, 'success');
                } else {
                    this.log(`Unable to fetch user information: ${userInfoResult.error}`, 'error');
                }

                await this.processCheckIn(telegramInitData);
                await this.processTreasury(telegramInitData);
                await this.processQuests(telegramInitData);
                await this.processGuildOperations(telegramInitData);

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            await this.countdown(65 * 60);
        }
    }
}

const client = new MemesWar();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});