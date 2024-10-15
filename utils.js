// botInitialProps.js
const botInitialProps = {
    color: '#ac08d5',
    accentColor: '#ffffff',
    name: 'Customer Assist',
    description: '',
    launcherIcon: '',
    launcherIconPath: '',
    agentImage: '',
    agentImagePath: '',
    agentAvatar: '',
    agentAvatarPath: '',
};

const convertBotProperties = async (item) => {
    return {
        color: item.color?.S || botInitialProps.color,
        accentColor: item.accentColor?.S || botInitialProps.accentColor,
        name: item.name?.S || botInitialProps.name,
        description: item.description?.S || "",
        launcherIcon: "",
        agentImage: "",
        agentAvatar: "",
        launcherIconPath: item.launcherIcon?.S || "",
        agentImagePath: item.agentImage?.S || "",
        agentAvatarPath: item.agentAvatar?.S || "",
    };
};

const convertClientInfo = async (item) => {
    return {
        companyname: item.companyname?.S || "",
    };
};

// Export the functions and constants using CommonJS syntax
module.exports = {
    botInitialProps,
    convertBotProperties,
    convertClientInfo,
};
