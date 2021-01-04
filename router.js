// https://segmentfault.com/a/1190000018534273 参考文档
const sha1 = require('sha1')
var express = require('express');
var router = express.Router();
const axios = require('axios').default;
const config = require('./config');
// 临时缓存
const cache = {
    access_token: {
        setTime: 0, //设置时间
        val: undefined //数据值
    },
    jsapi_ticket: {
        setTime: 0,
        val: undefined
    }
}
// 获取access_token
const getAccess_token = () => {
    if (cache.access_token.val && (Math.floor(Date.now()) - cache.access_token.setTime) / 1000 < 7100) {
        return Promise.resolve(cache.access_token.val);
    } else {
        console.log('getAccess_token')
        return new Promise((resolve, reject) => {
            axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`)
                .then(({status, data}) => {
                    console.log(status, data)
                    if (status === 200) {
                        cache.access_token.setTime = Math.floor(Date.now());
                        cache.access_token.val = data.access_token;
                        resolve(data.access_token);
                    } else {
                        reject(error)
                    }
                }).catch((error) => {
                    throw error;
                })
        })
    }
}
// 获取ticket
const getTicket = () => {
    if (cache.jsapi_ticket.val && (Math.floor(Date.now()) - cache.jsapi_ticket.setTime) / 1000 < 7100 ) {
        return Promise.resolve(cache.jsapi_ticket.val)
    } else {
        console.log('getTicket')
        return new Promise((resolve, reject) =>  {
            getAccess_token().then((access_token) => {
                console.log('access_token:',access_token)
                axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&&type=jsapi`)
                    .then(({status, data}) => {
                        if (status === 200) {
                            cache.jsapi_ticket.setTime = Math.floor(Date.now());
                            cache.jsapi_ticket.val = data.ticket;
                            resolve(data.ticket);
                        } else {
                            reject(error);
                        }
                    }).catch((error) => {
                        throw error;
                    })
            })
        })
    }
}
router.post('/getSign',(req, res) => {
    try {
        let params = req.body;
        if (!params && !params.url) {
            return res.send('please set url of page');
        }
        console.log(req.body)
        let url = params.url;
        getTicket().then(jsapi_ticket => {
            console.log(jsapi_ticket,':ticket')
            let num = Math.random();
            let noncestr = num.toString(32).substr(3, 20);
            let timestamp = Math.floor(Date.now() / 1000);
            let obj = {
                noncestr,
                timestamp,
                url,
                appId: config.appId,
                jsapi_ticket,
                signature: sha1('jsapi_ticket=' + jsapi_ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url)
            }
            res.send(obj);
        })
    } catch (error) {
        console.log('error')
        res.send(error)
    }
})
module.exports = router;
