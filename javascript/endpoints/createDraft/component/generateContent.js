const axios = require('axios');

async function generateContent(productName, productDescription) {
    try {
        const openAIAccessKey = process.env.OPENAI_API

        const prompt = `Given a product name "${productName}" and description "${productDescription}", generate the following. Just include your response, no number or explanation:
        1. Facebook Ad Text 1 (90-120 characters).
        2. Facebook Ad Text 2 (90-120 characters).
        3. Facebook Ad Text 3 (90-120 characters).
        4. Facebook Ad Text 4 (90-120 characters).
        5. Facebook Ad Text 5 (90-120 characters).
        6. Ad Headline 1 (5-30 characters).
        7. Ad Headline 2 (5-30 characters).
        8. Ad Headline 3 (5-30 characters).
        9. Ad Headline 4 (5-30 characters).
        10. Ad Headline 5 (5-30 characters).
        11. Ad Description 1 (up to 60 characters).
        12. Ad Description 2 (up to 60 characters).
        13. Ad Description 3 (up to 60 characters).
        14. Ad Description 4 (up to 60 characters).
        15. Ad Description 5 (up to 60 characters).
        16. Recommended ad location. United States is always a good answer unless the product could be localized further. .
        17. Target age range (in the format [minAge, maxAge]). Minimum 18.
        18. Target gender (men, women, or all).
        19. Top 6 Facebook ad interests (as a JavaScript array). Answer in the form of a JavaScript array, for example, ["Example", "Example"]. 
        20. Best CTA for the ad. The options for this are either LEARN_MORE, SIGN_UP, or SHOP_NOW.
        21. A good facebook campaign name for this product.
        22. A good facebook adset name for this product.
        23. A good facebook ad name for this product.
        Include the brackets and the quotes Here are all the possible interests to target: 
        
        Advertising, Agriculture, Architecture, Aviation, Banking, Investment banking, Online banking, Retail banking, 
        Business, Construction, Design, Fashion design, Graphic design, Interior design, Economics, Engineering, 
        Entrepreneurship, Health care, Higher education, Management, Marketing, Nursing, Online, Digital marketing, 
        Display advertising, Email marketing, Online advertising, Search engine optimization, Social media, 
        Social media marketing, Web design, Web development, Web hosting, Personal finance, Credit cards, Insurance, 
        Investment, Mortgage loans, Real estate, Retail, Sales, Science, Small business, Games, Action games, Board games, 
        Browser games, Card games, Casino games, First-person shooter games, Gambling, Massively multiplayer online games, 
        Massively multiplayer online role-playing games, Online games, Online poker, Puzzle video games, Racing games, 
        Role-playing games, Shooter games, Simulation games, Sports games, Strategy games, Video games, Word games, Ballet, 
        Bars, Concerts, Dancehalls, Music festivals, Nightclubs, Parties, Plays, Theatre, Action movies, Animated movies, 
        Anime movies, Bollywood movies, Comedy movies, Documentary movies, Drama movies, Fantasy movies, Horror movies, 
        Musical theatre, Science fiction movies, Thriller movies, Blues music, Classical music, Country music, Dance music, 
        Electronic music, Gospel music, Heavy metal music, Hip hop music, Jazz music, Music videos, Pop music, 
        Rhythm and blues music, Rock music, Soul music, Books, Comics, E-books, Fiction books, Literature, Magazines, 
        Manga, Mystery fiction, Newspapers, Non-fiction books, Romance novels, TV comedies, TV game shows, TV reality shows, 
        TV talkshows, Dating, Family, Fatherhood, Friendship, Marriage, Motherhood, Parenting, Weddings, Bodybuilding, 
        Meditation, Physical exercise, Physical fitness, Running, Weight training, Yoga, Alcoholic beverages, 
        Beer, Distilled beverage, Wine, Beverages, Coffee, Energy drinks, Juice, Soft drinks, Tea, Cooking, Baking, 
        Recipes, Cuisine, Chinese cuisine, French cuisine, German cuisine, Greek cuisine, Indian cuisine, Italian cuisine, 
        Japanese cuisine, Korean cuisine, Latin American cuisine, Mexican cuisine, Middle Eastern cuisine, Spanish cuisine, 
        Thai cuisine, Vietnamese cuisine, Food, Barbecue, Chocolate, Desserts, Fast food, Organic food, Pizza, Seafood, 
        Veganism, Vegetarianism, Restaurants, Coffee, Coffeehouses, Diners, Fast casual restaurants, Fast food restaurants, 
        Arts and music, Acting, Crafts, Dance, Drawing, Drums, Fine art, Guitar, Paint, Painting, Performing arts, 
        Photography, Sculpture, Singing, Writing, Do it yourself (DIY), Furniture, Gardening, Home Appliances, 
        Home improvement, Birds, Cats, Dogs, Fish, Horses, Pet food, Rabbits, Reptiles, Charity and causes,
         Community issues, Environmentalism, Law, Military, Politics, Religion, Sustainability, Veterans, Volunteering, 
         Adventure travel, Air travel, Beaches, Car rentals, Cruises, Ecotourism, Hotels, Lakes, Mountains, Nature, 
         Theme parks, Tourism, Vacations, Automobiles, Boats, Electric vehicle, Hybrids, Minivans, Motorcycles, RVs, SUVs, 
         Scooters, Trucks, Beauty, Beauty salons, Cosmetics, Fragrances, Hair products, Spas, Tattoos, Children’s clothing, 
         Men’s clothing, Shoes, Women’s clothing, Dresses, Handbags, Jewelry, Sunglasses, Boutiques, Coupons, 
         Discount stores, Luxury goods, Online shopping, Shopping malls, Toys, Outdoor recreation, Boating, Camping, 
         Fishing, Horseback riding, Hunting, Mountain biking, Surfing, American football, Association football (Soccer), 
         Auto racing, Baseball, Basketball, College football, Golf, Marathons, Skiing, Snowboarding, Swimming, Tennis, 
         Triathlons, Volleyball, Computer memory, Computer monitors, Computer processors, Computer servers, 
         Desktop computers, Free software, Hard drives, Network storage, Software, Tablet computers, Audio equipment, 
         Camcorders, Cameras, E-book readers, GPS devices, Game consoles, Mobile phones, Portable media players, 
         Projectors, Smartphones, Televisions
        `;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                //model: 'gpt-4',
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAIAccessKey}`  // Replace with your actual API key
                },
            }
        );

        if (response.data.choices && response.data.choices.length > 0) {
            console.log(response.data.choices[0].message.content)
            return response.data.choices[0].message.content;
        } else {
            throw new Error("No response from OpenAI");
        }
    } catch (error) {
        console.error('Error in generateContent.js:', error.response.data);
        return null;
    }
}




module.exports = generateContent