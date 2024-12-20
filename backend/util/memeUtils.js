const axios = require('axios');

const MEMEGEN_API_BASE_URL = 'https://api.memegen.link';

const fetchMemeTemplates = async () => {
    try {
        const response = await axios.get(`${MEMEGEN_API_BASE_URL}/templates`);
        return response.data.map(template => ({
            id: template.id,
            name: template.name,
            imageUrl: `${MEMEGEN_API_BASE_URL}/images/${template.id}.png`,
            lines: template.lines || 2 // Default to 2 lines if not specified
        }));
    } catch (error) {
        console.error("Error fetching meme templates:", error);
        throw error;
    }
};

const getRandomMemeTemplates = async (count = 12) => {
    try {
        const allTemplates = await fetchMemeTemplates();
        const shuffled = allTemplates.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    } catch (error) {
        console.error("Error getting random meme templates:", error);
        throw error;
    }
};

module.exports = {
    getRandomMemeTemplates,
};