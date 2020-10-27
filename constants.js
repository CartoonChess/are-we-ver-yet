// JS doesn't support enums, but we can use an object

// Can these be made const?

module.exports = {
    Category: {
        AMONGUS: 'among us',
        OTHER: 'general',
        ADMIN: 'admins only',
        PRIVATE: 'maintenance'
    },

    MentionType: {
        //GUILD: 'server', // ???
        CHANNEL: /^<#(\d+)>$/, // <#1234>
        ROLE: /^<@&(\d+)>$/, // <@&1234>
        USER: /^<@!?(\d+)>$/ // <@1234> (or @! if nick)
    }
};