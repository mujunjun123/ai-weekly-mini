const config=require('./config');
App({onLaunch(){if(config.transport==='cloud' && config.cloudEnv && wx.cloud) wx.cloud.init({env:config.cloudEnv,traceUser:false});}});
