const axios = require('axios');

async function generateMoreTextOptions(db, options, type, draftID) {
    try {
        const openAIAccessKey = process.env.OPENAI_API

        let prompt;

        if (type === 'primary') {
            prompt = `Given these example facebook ad primary texts: "${options} generate the following additional options that are very different so they are indistiguishable from the originals with a completely different style of writing. Just include your response, no number or explanation:
            1. Facebook Ad Primary Text 1 (90-120 characters).
            2. Facebook Ad Primary Text 2 (90-120 characters).
            3. Facebook Ad Primary Text 3 (90-120 characters).
            4. Facebook Ad Primary Text 4 (90-120 characters).
            5. Facebook Ad Primary Text 5 (90-120 characters).
            `;
        } else if (type === 'headline') {
            prompt = `Given these example facebook ad headline texts: "${options} generate the following additional options that are very different so they are indistiguishable from the originals with a completely different style of writing. Just include your response, no number or explanation:
            1. Ad Headline 1 (5-30 characters).
            2. Ad Headline 2 (5-30 characters).
            3. Ad Headline 3 (5-30 characters).
            4. Ad Headline 4 (5-30 characters).
            5. Ad Headline 5 (5-30 characters).
            `;
        } else if (type === 'description') {
            prompt = `Given these example facebook ad description texts: "${options} generate the following additional options that are very different so they are indistiguishable from the originals with a completely different style of writing. Just include your response, no number or explanation:
            1. Ad Description 1 (up to 60 characters).
            2. Ad Description 2 (up to 60 characters).
            3. Ad Description 3 (up to 60 characters).
            4. Ad Description 4 (up to 60 characters).
            5. Ad Description 5 (up to 60 characters).
            `;
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                //model: 'gpt-4',
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAIAccessKey}` 
                },
            }
        );

        if (response.data.choices && response.data.choices.length > 0) {
            console.log(response.data.choices[0].message.content)
            const aiResponse = response.data.choices[0].message.content;

            const aiResponseLines = aiResponse.split('\n');

            const option1 = aiResponseLines[0].substring(3).trim();
            const option2 = aiResponseLines[1].substring(3).trim();
            const option3 = aiResponseLines[2].substring(3).trim();
            const option4 = aiResponseLines[3].substring(3).trim();
            const option5 = aiResponseLines[4].substring(3).trim();

            options.push(option1, option2, option3, option4, option5);



            if (type === 'primary') {
                const res = await db.collection('drafts').doc(draftID).update({fb_PrimaryTextOptions: options});
            } else if (type === 'headline') {
                const res = await db.collection('drafts').doc(draftID).update({fb_HeadlineTextOptions: options});
            } else if (type === 'description') {
                const res = await db.collection('drafts').doc(draftID).update({fb_DescriptionTextOptions: options});
            }



            return options;
        } else {
            throw new Error("No response from OpenAI");
        }
    } catch (error) {
        console.error('Error in generateMoreTextOptions:', error);
        return null;
    }
}




module.exports = generateMoreTextOptions