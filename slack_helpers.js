module.exports.getUser = (bot, message) => {
    return new Promise(function(resolve, reject) {
        // Within context where you have a message object
        bot.api.users.info({user:message.user}, function(err,response) {
            if(err) {
                reject(err);
            }
            else {
                var currentUser = response["user"];
                resolve(currentUser.profile.display_name ||
                    currentUser.profile.real_name || 
                    currentUser.profile.name);
            }
        });
    });
};
