// import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { createRoot } from "react-dom/client";

/// <reference types="vite/client" />

// --- ICONS & DATA ---
// I've wrapped the icons for "Evolving Consumer Lifestyles" and "Financial Services" in JSX fragments (<>...</>)
// to resolve the "Adjacent JSX elements" error. Each icon definition must return a single root element.
const categoryIcons: { [key:string]: JSX.Element } = {
    "Technological Disruption": <><path d="M9.5 2.75a2.25 2.25 0 0 1 5 0V4h-5V2.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 8.25V6.5a2.5 2.5 0 0 0-5 0v1.75m5 0v3.75m-5-3.75v3.75m0-3.75H8.5m7 0h-1.5m1.5 0V12m-7 0V8.25m5 3.75v3.75m0 0H12m0 0h-1.5m-1.5 0v-3.75m0 0H8.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10.25a2.25 2.25 0 0 1 4.5 0v2.5a2.25 2.25 0 0 1-4.5 0v-2.5zM16 10.25a2.25 2.25 0 0 1 4.5 0v2.5a2.25 2.25 0 0 1-4.5 0v-2.5z" /></>,
    "Sustainability & The Green Transition": <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 7.5-13.43l-3.37-3.37a2.5 2.5 0 0 0-3.54 0L9.22 7.57A9.003 9.003 0 0 0 12 21zm0 0a8.96 8.96 0 0 1-4.88-1.57l7.25-7.25a9 9 0 0 0-2.37 8.82zM4.5 12.43A9 9 0 0 1 12 3a9 9 0 0 1 7.5 13.43" />,
    "Niche & Frontier Themes": <path strokeLinecap="round" strokeLinejoin="round" d="M12.44 3.75l1.62 3.28 3.63.53a.75.75 0 0 1 .42 1.28l-2.63 2.56.62 3.61a.75.75 0 0 1-1.09.79l-3.25-1.7-3.25 1.7a.75.75 0 0 1-1.09-.79l.62-3.61L4.77 8.84a.75.75 0 0 1 .42-1.28l3.63-.53 1.62-3.28a.75.75 0 0 1 1.35 0zM8.25 20.25l7.5-7.5" />,
    "Geopolitical & Economic Shifts": <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 21V3m-7.5 9h15M4.5 12a14.3 14.3 0 0 0 15 0 14.3 14.3 0 0 1-15 0z" />,
    "Demographics & Societal Shifts": <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 21V10.5a3.5 3.5 0 0 0-7 0V21m-3-3.5a3.5 3.5 0 0 0-7 0V21M6.5 3a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm11 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />,
    "Robotics, Automation & The New Industrial Revolution": <><path d="M14 10V8a4 4 0 0 0-8 0v2" /><path d="M4 10h16" /><path d="M4 14h16" /><path d="M12 14v4" /><path d="M8 18h8" /></>,
    "The Digital Consumer & Immersive Experiences": <><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /><path d="M12 12v6a2 2 0 0 0 2 2h4" /></>,
    "The Future of Real Estate & Infrastructure": <><path d="M4 21V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" /><path d="M9 21V9" /><path d="M15 21V9" /><path d="M4 7l8-4 8 4" /></>,
    "The Future of Mobility": <><path d="M19 17h2v-5h-2v5z" /><path d="M5 17H3v-5h2v5z" /><path d="M12 17v-5" /><path d="M2 12h20" /></>,
    "Evolving Consumer Lifestyles": <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    "Artificial Intelligence & Big Data": <><path d="M12 20v-4" /><path d="M12 8V4" /><path d="M12 14v-2" /><path d="M20 12h-4" /><path d="M8 12H4" /><path d="M18 18l-2-2" /><path d="M6 6l2 2" /><path d="M18 6l-2 2" /><path d="M6 18l2-2" /></>,
    "Financial Services": <><path d="M12 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    "Financial & Technical Metrics": <><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v5m-1.5-1.5h3" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9v5m-1.5-1.5h3" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9v5m-1.5-1.5h3" /></>,
    "Financial Filters": <><path d="M12 20v-4" /><path d="M12 8V4" /><path d="M12 14v-2" /><path d="M20 12h-4" /><path d="M8 12H4" /><path d="M18 18l-2-2" /><path d="M6 6l2 2" /><path d="M18 6l-2 2" /><path d="M6 18l2-2" /></>,
};
const THEME_DATA = [
    {
        name: "Technological Disruption",
        subCategories: [
            { name: "Artificial Intelligence & Big Data", themes: ["AI & Machine Learning", "Big Data & Analytics", "Semiconductors & AI Hardware", "Data and AI services", "Digital Analytics"] },
            { name: "The Future of Internet & Connectivity", themes: ["Cybersecurity", "Cloud Computing", "Internet of Things (IoT)", "5G & Next-Generation Networks"] },
            { name: "Digital Consumer & Immersive Experiences", themes: ["E-commerce & Online Marketplaces", "Creator Economy & Digital Platforms", "The Experience Economy", "Gaming & E-sports", "Streaming & Digital Content"] },
            { name: "Robotics, Automation & The New Industrial Revolution", themes: ["Robotics & Industrial Automation", "Drones & Unmanned Aerial Vehicles (UAVs)", "Space Exploration & Commercialization", "3D Printing (Additive Manufacturing)"] },
        ],
    },
    {
        name: "Sustainability & The Green Transition",
        subCategories: [
            { name: "Clean & Renewable Energy", themes: ["Clean & Renewable Energy", "Solar Energy", "Wind Energy", "Hydrogen & Fuel Cell Technology"] },
            { name: "Energy Storage & Battery Technology", themes: ["Energy Storage & Battery Technology"] },
            { name: "The Circular Economy & Resource Management", themes: ["The Circular Economy & Resource Management", "Waste Management & Recycling"] },
            { name: "Sustainable Food & AgriTech", themes: ["Sustainable Food & AgriTech", "The Plant-Based Revolution"] },
            { name: "Sustainable Materials", themes: ["Sustainable Materials"] },
            { name: "Water Technology & Purity", themes: ["Water Technology & Purity"] },
            { name: "The Blue Economy", themes: ["The Blue Economy"] },
        ],
    },
    {
        name: "The Future of Mobility",
        subCategories: [
            { name: "Mobility Tech", themes: ["Electric Vehicles (EVs)", "EV Infrastructure & Components"] },
        ],
    },
    {
        name: "Demographics & Societal Shifts",
        subCategories: [
            { name: "The Future of Healthcare", themes: ["The Future of Healthcare", "Genomics & Biotechnology", "Telemedicine & Digital Health", "Medical Devices & Advanced Healthcare Technology"] },
            { name: "Longevity & Aging Population", themes: ["Longevity & Aging Population"] },
            { name: "Education Technology (EdTech)", themes: ["Education Technology (EdTech)"] },
        ],
    },
    {
        name: "Evolving Consumer Lifestyles",
        subCategories: [
            { name: "Lifestyle", themes: ["Health & Wellness", "Pet Care"] },
        ],
    },
    {
        name: "Geopolitical & Economic Shifts",
        subCategories: [
            { name: "Global Dynamics", themes: ["Shifting Global Power Dynamics", "Defense & Aerospace", "Deglobalization & Reshoring", "The New Economic Order", "Geographic Focus (e.g., India, Southeast Asia)"] },
        ],
    },
    {
        name: "The Future of Real Estate & Infrastructure",
        subCategories: [
            { name: "Real Estate & Infra", themes: ["Global Infrastructure", "Smart Cities & Urbanization"] },
        ],
    },
    {
        name: "Financial Services",
        subCategories: [
            { name: "Finance", themes: ["Fintech & Digital Payments", "Alternative Finance", "Forex & Remittances", "Digital Asset & Blockchain Ecosystem"] },
        ],
    },
    {
        name: "Financial & Technical Metrics",
        subCategories: [
            { name: "Valuation", themes: ["Low Price-to-Earnings (P/E)", "Low Price-to-Book (P/B)", "Penny Stocks"] },
            { name: "Growth & Quality", themes: ["High Revenue Growth", "High Earnings Per Share (EPS) Growth", "High Return on Equity (ROE)", "Positive & Growing Free Cash Flow"] },
            { name: "Stability & Risk", themes: ["Low Volatility/Low Beta", "Low Debt-to-Equity Ratio", "High Beta"] },
            { name: "Ownership & Structure", themes: ["High Promoter/Insider Holding", "Low Float Stocks"] },
            { name: "Technical Indicators", themes: ["Golden Cross", "Oversold (RSI)", "Stocks Near 52-Week High", "Stocks Near 52-Week Low", "Strong Buy/Upgrades"] },
            { name: "Financial Filters", themes: ["High Sales Growth (>15%)", "High Profit Growth (>15%)", "High Pre-Tax Margin (>10%)", "Strong Interest Coverage (>3x)", "Reasonable PEG Ratio (0-1.5)", "Large Market Cap (>800 Cr)"] },
        ]
    },
    {
        name: "Niche & Frontier Themes",
        subCategories: [
            { name: "Niche", themes: ["Niche & Frontier Themes"] },
        ],
    },
];

// --- TYPES & STATE ---
interface Stock { id: string; name: string; businessSummary: string; annualSalesGrowth: number; assetTurnoverRatio: number; interestCoverageRatio: number; tickerSymbol: string; }
type View = 'home' | 'loading' | 'results';
const findIcon = (categoryName: string) => categoryIcons[categoryName];

// --- OPTIMIZED UI COMPONENTS ---
const AnimatedNumber = memo(({ value, isActive }: { value: number; isActive: boolean }) => {
    const [currentValue, setCurrentValue] = useState(0);
    const valueRef = useRef(value);
    useEffect(() => { valueRef.current = value; }, [value]);
    useEffect(() => {
        if (isActive) {
            setCurrentValue(0);
            let startTimestamp: number | null = null;
            const duration = 1000;
            const step = (timestamp: number) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                setCurrentValue(easedProgress * valueRef.current);
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
    }, [isActive]);
    const isInt = Number.isInteger(value);
    const displayValue = currentValue.toFixed(isInt ? 0 : 1);
    return <>{displayValue}</>;
});

const Sparkline = memo(({ growth, isActive }: { growth: number; isActive: boolean }) => {
    const pathRef = useRef<SVGPathElement>(null);
    const pathD = useMemo(() => {
        const isPositive = growth > 0;
        let d = "M 0 20";
        for (let i = 1; i <= 10; i++) {
            const x = i * 10;
            const randomFactor = (Math.random() - 0.5) * 10;
            const trendFactor = (i / 10) * (isPositive ? -12 : 12);
            d += ` L ${x.toFixed(2)} ${(20 + randomFactor + trendFactor).toFixed(2)}`;
        }
        return d;
    }, [growth]);

    useEffect(() => {
        const path = pathRef.current;
        if (path && isActive) {
            const length = path.getTotalLength();
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
            setTimeout(() => {
                path.style.transition = 'stroke-dashoffset 1.5s ease-out';
                path.style.strokeDashoffset = '0';
            }, 100);
        } else if (path) {
            path.style.transition = 'none';
        }
    }, [isActive, pathD]);

    return (
        <div className="sparkline-container">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                <path ref={pathRef} d={pathD} fill="none" className={growth > 0 ? 'positive' : 'negative'} strokeWidth="2" />
            </svg>
        </div>
    );
});

const StockReelItem = memo(({ stock, analysis, selectedThemes, isActive }: { stock: Stock; analysis: { loading: boolean; text: string; } | undefined; selectedThemes: string[]; isActive: boolean; }) => {
    const isAnalysisLoading = analysis?.loading;
    const isPositive = stock.annualSalesGrowth > 0;
    const cardThemesText = useMemo(() => {
        if (selectedThemes.length > 2) return `${selectedThemes.slice(0, 2).join(' & ')} & ${selectedThemes.length - 2} more`;
        return selectedThemes.join(' & ');
    }, [selectedThemes]);
    const cleanedTicker = stock.tickerSymbol.replace(/\.(NS|BO)$/, '');
    const screenerLink = `https://www.screener.in/company/${cleanedTicker}/`;

    return (
        <div className="reel-page stock-reel-item" role="article" aria-label={`Stock card for ${stock.name}`}>
            <div className={`reel-item-background ${isPositive ? 'positive-bg' : 'negative-bg'}`}></div>
            <div className="reel-item-content">
                <div className="reel-item-header">
                    <h3 className="reel-item-name">{stock.name}</h3>
                    <p className="reel-item-themes">{cardThemesText}</p>
                </div>
                <div className="reel-item-data-viz">
                    <div className="reel-item-chart">
                        <Sparkline growth={stock.annualSalesGrowth} isActive={isActive} />
                    </div>
                    <div className="reel-item-metrics">
                        <div className="metric-display">
                            <span className="metric-label">Sales Growth (YoY)</span>
                            <span className={`metric-value ${isPositive ? 'positive' : 'negative'}`}><AnimatedNumber value={stock.annualSalesGrowth} isActive={isActive} />%</span>
                        </div>
                        <div className="metric-display">
                            <span className="metric-label">Asset Turnover</span>
                            <span className="metric-value"><AnimatedNumber value={stock.assetTurnoverRatio} isActive={isActive} /></span>
                        </div>
                        <div className="metric-display">
                            <span className="metric-label">Interest Coverage</span>
                            <span className="metric-value"><AnimatedNumber value={stock.interestCoverageRatio} isActive={isActive} />x</span>
                        </div>
                    </div>
                </div>
                <div className="reel-item-details">
                    <div className={`ai-section ${analysis && !isAnalysisLoading ? 'loaded' : ''}`}>
                        {isAnalysisLoading && (
                            <div className="ai-loading-indicator">
                                <div className="ai-loader"></div><p>Generating AI Insight...</p>
                            </div>
                        )}
                        {analysis && !analysis.loading && analysis.text && (
                            <div className="ai-analysis" aria-live="polite">
                                {analysis.text.split('\n').map((line, idx) => {
                                    if (line.trim() === '') return null;

                                    if (line.startsWith('**')) { // It's a header
                                        const headerText = line.replace(/\*\*/g, '');
                                        return <p key={idx} className="analysis-header">{headerText}</p>;
                                    } else { // It's a regular point
                                        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- /, '');
                                        return <p key={idx} className="analysis-point" dangerouslySetInnerHTML={{ __html: formattedLine }}></p>;
                                    }
                                })}
                            </div>
                        )}
                        {analysis && !analysis.loading && !analysis.text && <p className="error-message">{analysis.text || "An error occurred."}</p>}
                    </div>
                    <a href={screenerLink} target="_blank" rel="noopener noreferrer" className="screener-link">
                        <span>View on Screener</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 0113.5 10.5z" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
});

const HomeScreen = memo(({ isExiting, selectedThemes, navigationPath, containerSize, handleCardClick, handleGoBack, handleAnalyzeClick, wrapperRef, themeToParentMap }: any) => {
    if (containerSize === 0) {
        return <div className={`page-content home-container`}><div className="circular-menu-wrapper" ref={wrapperRef}></div></div>;
    }
    const hasSelection = selectedThemes.length > 0;
    const orbitDuration = 25;

    const itemsToDisplay = useMemo(() => {
        let currentLevelData: any[] = THEME_DATA;
        navigationPath.forEach((pathName: string) => {
            const navItem = currentLevelData.find(item => item.name === pathName);
            if (navItem) currentLevelData = navItem.subCategories || navItem.themes || [];
        });
        if (Array.isArray(currentLevelData) && typeof currentLevelData[0] === 'string') {
            return currentLevelData.map((theme: string) => ({ name: theme, type: 'theme', isLeaf: true }));
        } else if (Array.isArray(currentLevelData)) {
            return currentLevelData.map(item => ({ ...item, type: item.themes ? 'subcategory' : 'category', isLeaf: !item.subCategories && !item.themes }));
        }
        return [];
    }, [navigationPath]);
    
    const { selectedParentCategories, selectedParentSubCategories } = useMemo(() => {
        const cats = new Set<string>();
        const subCats = new Set<string>();
        selectedThemes.forEach((theme:string) => {
            const parents = themeToParentMap[theme];
            if (parents) { cats.add(parents.category); subCats.add(parents.subCategory); }
        });
        return { selectedParentCategories: cats, selectedParentSubCategories: subCats };
    }, [selectedThemes, themeToParentMap]);

    const topLevelCategoryName = navigationPath[0];
    const topLevelCategoryIcon = topLevelCategoryName ? findIcon(topLevelCategoryName) : null;
    const parentName = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null;

    const { nebulaSize, itemWidth, radius } = useMemo(() => {
        const nebulaRatio = 0.42, itemWidthRatio = 0.21, gapRatio = 0.05;
        const nebulaSize = containerSize * nebulaRatio;
        const itemWidth = containerSize * itemWidthRatio;
        const gap = containerSize * gapRatio;
        const radius = (nebulaSize / 2) + (itemWidth / 2) + gap;
        return { nebulaSize, itemWidth, radius };
    }, [containerSize]);

    return (
        <div className={`page-content home-container ${isExiting ? 'fade-out' : ''}`}>
            {navigationPath.length > 0 && (
                <button className="back-button" onClick={handleGoBack} aria-label="Go back">
                    <svg fill="none" viewBox="0 0 24 24"><circle className="back-button-arc" cx="12" cy="12" r="9" /><path className="back-button-arrow" d="M14 15l-4-3 4-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            )}
            <div className="circular-menu-wrapper" ref={wrapperRef}>
                <div className="market-nebula" style={{ width: `${nebulaSize}px`, height: `${nebulaSize}px` }}>
                    <div className="nebula-content-wrapper">
                        <div className="orbit-container">
                            {selectedThemes.map((themeName: string, index: number) => {
                                const topCatName = THEME_DATA.find(cat => cat.subCategories.some(sub => sub.themes.includes(themeName)))?.name;
                                const icon = topCatName ? findIcon(topCatName) : null;
                                return (<div key={themeName} className="orbit-path" style={{ animationDelay: `-${(index / selectedThemes.length) * orbitDuration}s` }}><div className="orbiting-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{icon}</svg></div></div>);
                            })}
                        </div>
                        <div className="aura"><div className="aura-wave"></div><div className="aura-wave"></div><div className="aura-wave"></div></div>
                        <div className="nebula-glow"></div>
                        {hasSelection && (
                            <div className="nebula-core-visual">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none">{selectedThemes.map((_: any, i: number) => <path key={i} d={`M ${(20 - ((i - (selectedThemes.length - 1) / 2)) * 4).toFixed(2)} ${(75 + ((i - (selectedThemes.length - 1) / 2)) * 5).toFixed(2)} Q ${(35 - ((i - (selectedThemes.length - 1) / 2)) * 3).toFixed(2)} ${(25 - ((i - (selectedThemes.length - 1) / 2)) * 10).toFixed(2)}, 50 50 T ${(80 + ((i - (selectedThemes.length - 1) / 2)) * 4).toFixed(2)} ${(45 + ((i - (selectedThemes.length - 1) / 2)) * 5).toFixed(2)}`} fill="none" strokeWidth="2" />)}</svg>
                            </div>
                        )}
                        <div className="nebula-core"><div className="core-display"><div className="core-ring"></div><div className="core-ring"></div><div className="core-ring"></div><div className={`core-label ${parentName ? 'has-parent-name' : ''}`}>{parentName ? <span className="core-title">{parentName}</span> : <><span className="core-title">Theme Explorer</span><span className="core-subtitle">Discover Your Next Stock</span></>}</div></div></div>
                    </div>
                </div>
                <div className="circular-menu-container" key={navigationPath.join('/')}>
                    {itemsToDisplay.map((item: any, index: number) => {
                        const angle = (index / itemsToDisplay.length) * 360 - 90;
                        const x = radius * Math.cos(angle * Math.PI / 180);
                        const y = radius * Math.sin(angle * Math.PI / 180);
                        const isSelected = item.isLeaf && selectedThemes.includes(item.name);
                        const icon = item.type === 'category' ? findIcon(item.name) : topLevelCategoryIcon;
                        let hasSelectedChild = !item.isLeaf && hasSelection && (item.type === 'category' ? selectedParentCategories.has(item.name) : selectedParentSubCategories.has(item.name));
                        return (
                            <button key={item.name} className={`circular-menu-item ${isSelected ? 'selected' : ''} ${hasSelectedChild ? 'has-selection' : ''} ${item.isLeaf ? 'is-leaf' : ''}`} style={{ width: `${itemWidth}px`, height: `${itemWidth}px`, ['--transform-pos' as any]: `translate(-50%, -50%) translate(${x}px, ${y}px)`, transitionDelay: `${index * 50}ms` }} onClick={() => handleCardClick(item.name, item.isLeaf)}>
                                {icon && !item.isLeaf && <div className="circular-item-icon" style={{width: `${itemWidth * 0.3}px`, height: `${itemWidth * 0.3}px`}}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{icon}</svg></div>}
                                <span className="circular-item-name" style={{fontSize: `${Math.max(8, itemWidth * 0.12)}px`}}>{item.name}</span>
                                {isSelected && <div className="selection-indicator" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="launchpad-container">
                <button className={`launch-control-button ${hasSelection ? 'active' : ''}`} onClick={handleAnalyzeClick} disabled={!hasSelection}>
                    <div className="button-background"></div><div className="button-glow"></div>
                    <span className="button-text">{hasSelection ? 'Launch Analysis' : 'Select Investment Themes'}</span>
                    {hasSelection && <span className="theme-counter">{selectedThemes.length}</span>}
                </button>
            </div>
        </div>
    );
});

const LoadingScreen = memo(({ selectedThemes }: { selectedThemes: string[] }) => (
    <div className="page-content loader-container">
        <div className="loader"></div>
        <p>Analyzing themes: "{selectedThemes.join(' + ')}"...</p>
    </div>
));

const ResultsScreen = memo(({ isExiting, stocks, analysis, selectedThemes, currentPage, handleBack, reelsRef, handleReelsScroll }: any) => {
    return (
        <div className={`page-content results-view ${isExiting ? 'fade-out' : ''}`}>
            <button className="back-button" onClick={handleBack} aria-label="Go back to themes">
                <svg fill="none" viewBox="0 0 24 24"><circle className="back-button-arc" cx="12" cy="12" r="9" /><path className="back-button-arrow" d="M14 15l-4-3 4-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="reel-page-indicator">{currentPage} / {stocks.length}</div>
            <div className="reels-feed-container" ref={reelsRef} onScroll={handleReelsScroll}>
                {stocks.map((stock: Stock, index: number) => (
                    <StockReelItem key={stock.id} stock={stock} analysis={analysis[stock.id]} selectedThemes={selectedThemes} isActive={(index + 1) === currentPage} />
                ))}
            </div>
        </div>
    );
});

// --- REACT APP ---
function App() {
    const [view, setView] = useState<View>('home');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [analysis, setAnalysis] = useState<{ [stockId: string]: { loading: boolean; text: string } }>({});
    const [isExiting, setIsExiting] = useState(false);
    const [navigationPath, setNavigationPath] = useState<string[]>([]);
    const [containerSize, setContainerSize] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // const ai = useMemo(() => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! }), []);
    const themeToParentMap = useMemo(() => {
        const map: { [key: string]: { subCategory: string; category: string } } = {};
        THEME_DATA.forEach(c => c.subCategories.forEach(sc => sc.themes.forEach(t => { map[t] = { subCategory: sc.name, category: c.name }; })));
        return map;
    }, []);

    const reelsRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const prevViewRef = useRef<View>(view);

    useEffect(() => {
        const element = wrapperRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry?.contentRect.width > 0) {
                requestAnimationFrame(() => setContainerSize(entry.contentRect.width));
            }
        });
        observer.observe(element);
        if (element.clientWidth > 0) setContainerSize(element.clientWidth);
        return () => observer.disconnect();
    }, []);

    const transitionToView = useCallback((newView: View, onComplete?: () => void) => {
        setIsExiting(true);
        setTimeout(() => {
            setView(newView);
            setIsExiting(false);
            onComplete?.();
        }, 500);
    }, []);

    const handleCardClick = useCallback((itemName: string, isLeaf: boolean) => {
        if (isLeaf) setSelectedThemes(p => p.includes(itemName) ? p.filter(t => t !== itemName) : [...p, itemName]);
        else setNavigationPath(p => [...p, itemName]);
    }, []);

    const handleGoBack = useCallback(() => setNavigationPath(p => p.slice(0, -1)), []);

    const handleBack = useCallback(() => {
        transitionToView('home', () => {
            setSelectedThemes([]); setStocks([]); setAnalysis({}); setNavigationPath([]); setCurrentPage(1);
        });
    }, [transitionToView]);

    const handleGetAIAnalysis = useCallback(async (stock: Stock) => {
        if (!stock || !stock.businessSummary || analysis[stock.id]) return;
        setAnalysis(p => ({ ...p, [stock.id]: { loading: false, text: stock.businessSummary } }));
    }, [analysis]);

    const handleAnalyzeClick = useCallback(() => {
        if (selectedThemes.length === 0) return;
        transitionToView('loading', async () => {
            try {
                const apiUrl = `http://${window.location.hostname}:3001/api/stocks/by-themes`;
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ themes: selectedThemes }),
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch stocks');
                }
                const data = await response.json();
                setStocks(data);
                setView('results');
            } catch (error) {
                console.error("Failed to fetch stocks:", error);
                // Optionally, handle the error in the UI, e.g., show an error message
                // For now, we'll just go back to the home screen
                setView('home');
            }
        });
    }, [selectedThemes, transitionToView]);

    useEffect(() => {
        if (view === 'results' && prevViewRef.current !== 'results') {
            stocks.forEach(handleGetAIAnalysis);
        }
        prevViewRef.current = view;
    }, [view, stocks, handleGetAIAnalysis]);

    const handleReelsScroll = useCallback(() => {
        const container = reelsRef.current;
        if (container) {
            const pageHeight = container.clientHeight;
            const currentPageCalc = Math.round((container.scrollTop + 1) / pageHeight) + 1;
            setCurrentPage(p => currentPageCalc !== p ? currentPageCalc : p);
        }
    }, []);

    let currentView;
    switch(view) {
        case 'home': currentView = <HomeScreen isExiting={isExiting} selectedThemes={selectedThemes} navigationPath={navigationPath} containerSize={containerSize} handleCardClick={handleCardClick} handleGoBack={handleGoBack} handleAnalyzeClick={handleAnalyzeClick} wrapperRef={wrapperRef} themeToParentMap={themeToParentMap} />; break;
        case 'loading': currentView = <LoadingScreen selectedThemes={selectedThemes} />; break;
        case 'results': currentView = <ResultsScreen isExiting={isExiting} stocks={stocks} analysis={analysis} selectedThemes={selectedThemes} currentPage={currentPage} handleBack={handleBack} reelsRef={reelsRef} handleReelsScroll={handleReelsScroll} />; break;
        default: currentView = <HomeScreen isExiting={isExiting} selectedThemes={selectedThemes} navigationPath={navigationPath} containerSize={containerSize} handleCardClick={handleCardClick} handleGoBack={handleGoBack} handleAnalyzeClick={handleAnalyzeClick} wrapperRef={wrapperRef} themeToParentMap={themeToParentMap} />;
    }

    return <main className="app-container">{currentView}</main>;
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}