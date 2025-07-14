import express from 'express';
import neo4j from 'neo4j-driver';
import cors from 'cors';

// --- Neo4j Connection ---
const NEO4J_URI = "bolt://localhost:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "harshit123";

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- Hardcoded Investment Themes ---
const mainCategories = [
    "Technological Disruption", "Sustainability & The Green Transition", "Niche & Frontier Themes",
    "Geopolitical & Economic Shifts", "Demographics & Societal Shifts", "Robotics, Automation & The New Industrial Revolution",
    "The Digital Consumer & Immersive Experiences", "The Future of Real Estate & Infrastructure", "The Future of Mobility",
    "Evolving Consumer Lifestyles", "Artificial Intelligence & Big Data", "Financial Services"
];

const subCategories = [
    "AI & Machine Learning", "Alternative Finance", "Big Data & Analytics", "Clean & Renewable Energy",
    "Cloud Computing", "Creator Economy & Digital Platforms", "Cybersecurity", "Data and AI services",
    "Defense & Aerospace", "Deglobalization & Reshoring", "Digital Analytics", "Digital Asset & Blockchain Ecosystem",
    "Digital Consumer & Immersive Experiences", "Digital Platforms", "Drones & Unmanned Aerial Vehicles (UAVs)",
    "E-commerce & Online Marketplaces", "Education Technology (EdTech)", "Electric Vehicles (EVs)",
    "Energy Storage & Battery Technology", "EV Infrastructure & Components", "Evolving Consumer Lifestyles",
    "Fintech & Digital Payments", "Forex & Remittances", "Geographic Focus (e.g., India, Southeast Asia)",
    "Global Infrastructure", "Health & Wellness", "Internet of Things (IoT)", "Longevity & Aging Population",
    "Medical Devices & Advanced Healthcare Technology", "Niche & Frontier Themes", "Robotics & Industrial Automation",
    "Semiconductors & AI Hardware", "Shifting Global Power Dynamics", "Smart Cities & Urbanization",
    "Space Exploration & Commercialization", "Sustainable Food & AgriTech", "Sustainable Materials",
    "The Blue Economy", "The Circular Economy & Resource Management", "The Experience Economy",
    "The Future of Healthcare", "The Future of Internet & Connectivity", "The Future of Mobility",
    "The Future of Real Estate & Infrastructure", "The New Economic Order", "Water Technology & Purity"
];

const trendingThemes = [
    "5G & Next-Generation Networks", "3D Printing (Additive Manufacturing)", "Genomics & Biotechnology",
    "Gaming & E-sports", "Hydrogen & Fuel Cell Technology", "Pet Care", "Solar Energy",
    "Streaming & Digital Content", "Telemedicine & Digital Health", "The Plant-Based Revolution",
    "Waste Management & Recycling", "Wind Energy", "Golden Cross", "High Beta", "High Dividend Yield",
    "High Earnings Per Share (EPS) Growth", "High Promoter/Insider Holding", "High Return on Equity (ROE)",
    "High Revenue Growth", "Low Beta", "Low Debt-to-Equity Ratio", "Low Float Stocks",
    "Low Price-to-Book (P/B)", "Low Price-to-Earnings (P/E)", "Low Volatility/Low Beta",
    "Oversold (RSI)", "Penny Stocks", "Positive & Growing Free Cash Flow", "Stocks Near 52-Week High",
    "Stocks Near 52-Week Low", "Strong Buy/Upgrades"
];

const financialFilters = {
    "High Sales Growth (>15%)": "s.annualSalesGrowth > 0.15",
    "High Profit Growth (>15%)": "s.patGrowthYoY > 0.15",
    "High Pre-Tax Margin (>10%)": "s.preTaxMargin > 0.10",
    "Strong Interest Coverage (>3x)": "s.interestCoverageRatio > 3",
    "Reasonable PEG Ratio (0-1.5)": "s.pegRatio > 0 AND s.pegRatio < 1.5",
    "Large Market Cap (>800 Cr)": "s.marketCapInRupees > 8000000000"
};

app.get('/', (req, res) => {
    res.send('FinAI Stock Explorer Backend is running!');
});

// --- API Endpoints ---

// Endpoint to get stocks based on a list of themes
app.post('/api/stocks/by-themes', async (req, res) => {
    const session = driver.session();
    const { themes } = req.body;

    console.log('Received themes:', themes);

    if (!themes || !Array.isArray(themes) || themes.length === 0) {
        return res.status(400).send('Please provide a non-empty array of themes.');
    }

    try {
        const selectedFinancialFilters = themes.filter(theme => financialFilters[theme]);
        const selectedThemes = themes.filter(theme => !financialFilters[theme]);

        const financialFilterClauses = selectedFinancialFilters.map(filter => `(${financialFilters[filter]})`);

        const query = `
            MATCH (s:Stock)
            ${financialFilterClauses.length > 0 ? `WHERE ${financialFilterClauses.join(' AND ')}` : ''}
            WITH s
            // Use pattern comprehension to create lists of theme names for each relationship type
            WITH s,
                 [(s)-[:BELONGS_TO]->(sub:SubCategory)-[:PART_OF]->(main:MainCategory) | main.name] as mainCategoryNames,
                 [(s)-[:BELONGS_TO]->(sub:SubCategory) | sub.name] as subCategoryNames,
                 [(s)-[:EXHIBITS_THEME]->(t:TrendingTheme) | t.name] as trendingThemeNames

            // Combine all unique theme names into a single list for the stock
            WITH s, apoc.coll.toSet(mainCategoryNames + subCategoryNames + trendingThemeNames) as stockThemes

            // Filter stocks to include only those that have all the selected themes
            ${selectedThemes.length > 0 ? `WHERE size([theme IN $selectedThemes WHERE theme IN stockThemes]) = size($selectedThemes)` : ''}

            RETURN s.name as name,
                   s.tickerSymbol as tickerSymbol,
                   s.marketCapInRupees as marketCapInRupees,
                   s.businessSummary as businessSummary,
                   s.annualSalesGrowth as annualSalesGrowth,
                   s.assetTurnoverRatio as assetTurnoverRatio,
                   s.interestCoverageRatio as interestCoverageRatio,
                   elementId(s) as id,
                   $selectedThemes as matchedThemes
            LIMIT 25
        `;

        const params = { selectedThemes };

        console.log('Generated query:', query);
        console.log('Query params:', params);

        const result = await session.run(query, params);

        const stocks = result.records.map(record => record.toObject());

        console.log('Database result:', stocks);

        res.json(stocks);
    } catch (error) {
        console.error('Error fetching stocks by themes:', error);
        res.status(500).send('Error fetching stocks by themes');
    } finally {
        await session.close();
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('exit', async () => {
    await driver.close();
});