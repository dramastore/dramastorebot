const { Telegraf } = require('telegraf')
const mongoose = require('mongoose')
require('dotenv').config()
const bot = new Telegraf(process.env.BOT_TOKEN)
mongoose.connect(`mongodb://${process.env.USER}:${process.env.PASS}@nodetuts-shard-00-00.ngo9k.mongodb.net:27017,nodetuts-shard-00-01.ngo9k.mongodb.net:27017,nodetuts-shard-00-02.ngo9k.mongodb.net:27017/dramastore?ssl=true&replicaSet=atlas-pyxyme-shard-0&authSource=admin&retryWrites=true&w=majority`)
    .then(() => console.log('Connected to dramastore database'))
    .catch((err) => console.log(err.message))
const userModel = require('./models/botusers')
const homeModel = require('./models/home-db')

bot.start(ctx => {
    let myFav = [1006615854, 1937862156, 1102676922, 1142303079, 1473393723]
    bot.telegram.sendChatAction(ctx.chat.id, 'typing')
    let msg = `Hello <b>${ctx.message.chat.first_name}</b> <pre>\n\n</pre>I'm a bot created by <b>@shemdoe</b>. Use me to search drama in dramastore. <pre>\n\n</pre>To search drama start with <code>/drama </code> followed by the name of drama. <pre>\n\n</pre><u>For example:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Also send me <code>/drama</code> followed by year to get all dramas of that year, for example: <pre>\n</pre><code>/drama 2016</code>`
    if (myFav.includes(ctx.chat.id)) {
        msg = `Hello <b>${ctx.message.chat.first_name}</b> karibu <pre>\n\n</pre>Mimi ni Robot mtoto wa <b>@shemdoe</b> 😀, na amenieleza mengi sana kuhusu wewe <b>${ctx.chat.first_name}</b> hadi nimekupenda bure...😍<pre>\n\n</pre>BTW tuachane na hayo... Just Use me to search drama in dramastore. <pre>\n\n</pre>Ku search drama anza na <code>/drama </code> ikifwatiwa na jina la drama. <pre>\n\n</pre><u>Mfano:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Pia kupata drama zote za mwaka, anza na <code>/drama</code> ikifwatiwa na mwaka, kwa mfano: <pre>\n</pre><code>/drama 2016</code>`
    }
    ctx.reply(msg, { parse_mode: 'HTML' })
    let id = ctx.message.chat.id
    let name = ctx.message.chat.first_name
    userModel.findOneAndUpdate({ id }, { id, name }, { upsert: true, new: true })
        .then(() => console.log(`${name} is added to database`))
        .catch((err) => {
            console.log(err.message)
            ctx.reply("I failed to allow you to use me, Please contact @shemdoe and tell him this...")
        })
})

let isWorking = []
bot.on('text', async (ctx) => {
    try {
        if (isWorking.includes(ctx.chat.id)) {
            let msgID = ctx.message.message_id
            let chatid = ctx.chat.id
            let msg = "<b>Oh! f*ck... Please wait, I\'m still sending you dramas</b>"
            bot.telegram.sendMessage(chatid, msg, { reply_to_message_id: msgID, parse_mode: 'HTML' })
        }
        if (!isWorking.includes(ctx.chat.id)) {
            if (ctx.message.text.includes('/drama')) {
                //notice space after drama--- this is to delete space before drama name
                if (ctx.message.text == '/drama') {
                    ctx.reply('After <code>/drama</code> then the name of drama is followed... example - <pre>\n</pre><code>/drama Squid game</code>', { parse_mode: 'HTML' })
                }
                let drama = ctx.message.text.split('/drama ')[1]
                let dramaArray = drama.split(" ")

                bot.telegram.sendChatAction(ctx.chat.id, 'typing')

                //this is like .find({ dramaName: /searching/i}) and i is for case insensitive
                homeModel.find({ dramaName: new RegExp(drama, 'i') }).limit(100).then((dramas) => {
                    ctx.reply(`<b>${dramas.length}</b> dramas were found`, { parse_mode: 'HTML' })
                    if (dramas.length > 0) {
                        if (!isWorking.includes(ctx.chat.id)) {
                            isWorking.push(ctx.chat.id) //kama id haipo tunaongeza
                        }
                        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                        dramas.forEach((d, index) => {
                            setTimeout(() => {
                                if (d.episodesUrl.includes('//t.me')) {
                                    ctx.reply(`<b><a href="${d.imageUrl}">◾</a> ${d.dramaName}<pre>\n</pre> __________</b>`, {
                                        parse_mode: 'HTML',
                                        disable_web_page_preview: false,
                                        reply_markup: {
                                            inline_keyboard: [
                                                [
                                                    { text: `⬇ GET - ${d.dramaName.substring(0, 20)}`, url: `${d.episodesUrl}` }
                                                ]
                                            ]
                                        }
                                    })
                                }
                                else {
                                    ctx.reply(`<b><a href="${d.imageUrl}">◾</a> ${d.dramaName}<pre>\n</pre> __________</b>`, {
                                        parse_mode: 'HTML',
                                        disable_web_page_preview: false,
                                        reply_markup: {
                                            inline_keyboard: [
                                                [
                                                    { text: `⬇ GET - ${d.dramaName.substring(0, 20)}`, url: `www.dramastore.xyz/${d.episodesUrl}` }
                                                ]
                                            ]
                                        }
                                    })
                                }
                                //anglia kama idadi == index ya  mwisho ya iteration
                                if ((dramas.length - 1) == index) {
                                    let del = isWorking.indexOf(ctx.chat.id)
                                    isWorking.splice(del, 1)  //ondoa kwenye isWorking
                                    ctx.reply('I\'m done... You can search again')
                                }
                            }, index * 1200)
                        })
                    }
                    else {
                        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                        ctx.reply("No drama found by that name... but wait!!!.. let me try to find other dramas match that name")

                        //Tumia RegEx() na unganisha kwa | itatafuta kati ya hizo (or)
                        if (dramaArray.length > 1) {
                            bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                            let joiner = dramaArray.join('|').replace(/ /g, '')
                            let regex = new RegExp(joiner, 'i')
                            homeModel.find({ dramaName: regex }).limit(100).sort('dramaName')
                                .then((ds) => {
                                    ctx.reply(`<b>${ds.length}</b> dramas were found`, { parse_mode: 'HTML' })
                                    bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                                    setTimeout(() => {
                                        if (ds.length > 0) {
                                            if (!isWorking.includes(ctx.chat.id)) {
                                                isWorking.push(ctx.chat.id)
                                            }
                                            ds.forEach((d, index) => {
                                                setTimeout(() => {
                                                    if (ds.length > 30) { bot.telegram.sendChatAction(ctx.chat.id, 'typing') }
                                                    if (d.episodesUrl.includes('//t.me')) {
                                                        ctx.reply(`<b><a href="${d.imageUrl}">◾</a> ${d.dramaName}<pre>\n</pre> __________</b>`, {
                                                            parse_mode: 'HTML',
                                                            disable_web_page_preview: false,
                                                            reply_markup: {
                                                                inline_keyboard: [
                                                                    [
                                                                        { text: `⬇ GET - ${d.dramaName.substring(0, 20)}`, url: `${d.episodesUrl}` }
                                                                    ]
                                                                ]
                                                            }
                                                        })
                                                    }
                                                    else {
                                                        ctx.reply(`<b><a href="${d.imageUrl}">◾</a> ${d.dramaName}<pre>\n</pre> __________</b>`, {
                                                            parse_mode: 'HTML',
                                                            disable_web_page_preview: false,
                                                            reply_markup: {
                                                                inline_keyboard: [
                                                                    [
                                                                        { text: `⬇ GET - ${d.dramaName.substring(0, 20)}`, url: `www.dramastore.xyz/${d.episodesUrl}` }
                                                                    ]
                                                                ]
                                                            }
                                                        })
                                                    }
                                                    if ((ds.length - 1) == index) {
                                                        let del = isWorking.indexOf(ctx.chat.id)
                                                        isWorking.splice(del, 1)
                                                        setTimeout(() => {
                                                            ctx.reply('I\'m done... You can search again')
                                                        }, 2000)

                                                    }
                                                }, index * 1200)
                                            })
                                        }
                                        else {
                                            bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                                            setTimeout(() => {
                                                ctx.reply(`Ooopss! Sorry <b>${ctx.message.chat.first_name}..😥</b> No drama found... <pre>\n</pre>Request the drama from @shemdoe`, {
                                                    reply_markup: {
                                                        inline_keyboard: [
                                                            [
                                                                { text: "Request drama", url: 't.me/shemdoe' }
                                                            ]
                                                        ]
                                                    }
                                                    , parse_mode: 'HTML'
                                                })
                                            }, 1000)

                                        }
                                    }, 2000)

                                })
                                .catch((err) => {
                                    console.log(err.message)
                                    console.log(`Failed with ${ctx.message.text}`)
                                })
                        }
                        else {
                            bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                            setTimeout(() => {
                                ctx.reply(`Ooopss! Sorry <b>${ctx.message.chat.first_name}..😥</b> No drama found... <pre>\n</pre>Request the drama from @shemdoe`, {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: "Request drama", url: 't.me/shemdoe' }
                                            ]
                                        ]
                                    }
                                    , parse_mode: 'HTML'
                                })
                            }, 3000)
                        }
                    }

                })
                    .catch((err) => {
                        console.log(err.message)
                        console.log(`Failed on ${ctx.message.text}`)
                        ctx.reply(`Failed to get the drama, contact @shemdoe with this`)
                    })
            }

            else {
                bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                let msg = `Hello <b>${ctx.message.chat.first_name}</b> <pre>\n\n</pre>To search drama start with <code>/drama </code> followed by the name of drama. <pre>\n\n</pre><u>For example:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Also send me <code>/drama</code> followed by year to get all dramas of that year, for example: <pre>\n</pre><code>/drama 2016</code>`
                ctx.reply(msg, { parse_mode: 'HTML' })
            }
        }
    } catch (err) {
        console.log(err.message)
        ctx.reply("Failed to search drama... correct your search and try again")
        ctx.reply(`And forward this msg to @shemdoe --- ${err.message}`)
    }


})

bot.on('photo', ctx => {
    let admin = [1473393723, 741815228]

    if (admin.includes(ctx.chat.id)) {
        let photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id
        let caption = ctx.message.caption
        let caption_entities = ctx.message.caption_entities

        if (caption.includes('#Ads')) {
            userModel.find().then((subs) => {
                subs.forEach((sub, index) => {
                    setTimeout(() => {
                        bot.telegram.sendPhoto(sub.id, photoId, { caption, caption_entities })
                    }, index * 100)

                })
            })
                .catch((err) => ctx.reply(err.message))
        }
    }
    else {
        let msg = `Hello <b>${ctx.message.chat.first_name}</b> <pre>\n\n</pre>To search drama start with <code>/drama </code> followed by the name of drama. <pre>\n\n</pre><u>For example:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Also send me <code>/drama</code> followed by year to get all dramas of that year, for example: <pre>\n</pre><code>/drama 2016</code>`
        ctx.reply(msg, { parse_mode: 'HTML' })
    }
})

bot.launch()
    .then(() => console.log('Bot Is Running'))
    .catch((err) => console.log(err.message))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

process.on('unhandledRejection', (reason, promise) => {
    bot.telegram.sendMessage(1473393723, reason.response.description)
    console.log(reason.response.description)
    process.exit(0)
    //on production here process will change from crash to start
})

