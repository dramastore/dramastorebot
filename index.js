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

bot.on('text', (ctx) => {
    if (ctx.message.text.includes('/drama')) {
        //notice space after drama--- this is to delete space before drama name
        let drama = ctx.message.text.split('/drama ')[1]
        let dramaArray = drama.split(" ")

        bot.telegram.sendChatAction(ctx.chat.id, 'typing')

        //this is like .find({ dramaName: /searching/i}) and i is for case insensitive
        homeModel.find({ dramaName: new RegExp(drama, 'i') }).then((dramas) => {
            if (dramas.length > 0) {
                dramas.forEach(d => {
                    if (d.episodesUrl.includes('//t.me')) {
                        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                        ctx.reply(`<b>◾ ${d.dramaName}<pre>\n</pre>${d.episodesUrl}</b>`, { parse_mode: 'HTML', disable_web_page_preview: true })
                    }
                    else {
                        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                        ctx.reply(`<b>◾ ${d.dramaName}<pre>\n</pre>www.dramastore.xyz/${d.episodesUrl}</b>`, { parse_mode: 'HTML', disable_web_page_preview: true })
                    }
                })
            }
            else {
                bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                ctx.reply("No drama found by that name... but wait!!!.. let me try to find other dramas match that name")

                //Tumia RegEx() na unganisha kwa | itatafuta kati ya hizo (or)
                if (dramaArray.length > 1) {
                    bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                    let joiner = dramaArray.join('|')
                    let regex = new RegExp(joiner, 'i')
                    homeModel.find({ dramaName: regex }).sort('dramaName')
                        .then((ds) => {
                            if (ds.length > 0) {
                                ds.forEach(d => {
                                    bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                                    if (d.episodesUrl.includes('//t.me')) {
                                        ctx.reply(`<b>◾ ${d.dramaName}<pre>\n</pre>${d.episodesUrl}</b>`, { parse_mode: 'HTML', disable_web_page_preview: true })
                                    }
                                    else {
                                        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
                                        ctx.reply(`<b>◾ ${d.dramaName}<pre>\n</pre>www.dramastore.xyz/${d.episodesUrl}</b>`, { parse_mode: 'HTML', disable_web_page_preview: true })
                                    }
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
            }

        })
    }

    else {
        bot.telegram.sendChatAction(ctx.chat.id, 'typing')
        let msg = `Hello <b>${ctx.message.chat.first_name}</b> <pre>\n\n</pre>To search drama start with <code>/drama </code> followed by the name of drama. <pre>\n\n</pre><u>For example:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Also send me <code>/drama</code> followed by year to get all dramas of that year, for example: <pre>\n</pre><code>/drama 2016</code>`
        ctx.reply(msg, { parse_mode: 'HTML' })
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
                subs.forEach(sub => {
                    bot.telegram.sendPhoto(sub.id, photoId, { caption, caption_entities })
                })
            })
        }
    }
    else {
        let msg = `Hello <b>${ctx.message.chat.first_name}</b> <pre>\n\n</pre>To search drama start with <code>/drama </code> followed by the name of drama. <pre>\n\n</pre><u>For example:</u><pre>\n</pre><code>/drama police university</code><pre>\n\n</pre>Also send me <code>/drama</code> followed by year to get all dramas of that year, for example: <pre>\n</pre><code>/drama 2016</code>`
        ctx.reply(msg, { parse_mode: 'HTML' })
    }
})

bot.launch().then(() => console.log('Bot Is Running'))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

