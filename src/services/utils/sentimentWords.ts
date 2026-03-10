export const positiveWords = [
	// earnings & financials
	"beat", "profit", "revenue", "earnings", "dividend", "surplus", "income",
	"margin", "cashflow", "solvent", "liquidity", "returns", "yield", "eps",
	"topline", "bottomline", "free cash flow", "operating income", "net income",
	"gross profit", "ebitda", "roe", "roa", "roce", "book value", "asset",

	// growth
	"surge", "growth", "expansion", "breakout", "milestone", "record",
	"accelerate", "soar", "climb", "jump", "spike", "boom", "explode",
	"skyrocket", "double", "triple", "outgrow", "multiply", "scale",
	"hypergrowth", "exponential", "tenfold", "uptrend", "all-time high",

	// analyst actions
	"upgrade", "outperform", "overweight", "buy", "accumulate", "target",
	"bullish", "optimistic", "confident", "positive", "strong", "conviction",
	"initiating coverage", "price target raised", "top pick", "best idea",
	"reiterate buy", "strong buy", "catalyst", "re-rate", "re-rating",

	// business
	"partnership", "acquisition", "contract", "deal", "launch", "innovation",
	"patent", "approval", "win", "award", "expand", "hire", "invest",
	"capex", "buyback", "rally", "rebound", "recover", "turnaround",
	"market share", "new product", "new market", "joint venture", "merger",
	"strategic", "synergy", "diversify", "monetize", "licensing", "royalty",
	"subscription", "recurring revenue", "backlog", "order book", "pipeline",

	// macro positive
	"stimulus", "rate cut", "easing", "reform", "deregulation", "supportive",
	"stable", "steady", "resilient", "robust", "momentum", "upside",
	"outpace", "exceed", "surpass", "top", "gain", "advance",
	"increase", "rise", "improve", "boost", "strengthen", "solid",
	"healthy", "optimism", "confidence", "demand", "prosper",
	"efficient", "productive", "leading", "dominant", "disrupt", "pioneer",
	"tailwind", "favorable", "soft landing", "goldilocks", "low inflation",
	"employment", "gdp growth", "consumer spending", "capex cycle",

	// sentiment & momentum
	"breakout", "support", "oversold", "undervalued", "cheap", "discount",
	"value play", "hidden gem", "turnaround story", "re-rating candidate",
	"high conviction", "strong momentum", "relative strength", "outperforming",
	"52-week high", "multi-year high", "fresh high", "new high", "institutional buying",
	"fii buying", "dii buying", "block deal", "bulk deal", "insider buying",
	"promoter buying", "stake increase", "short covering", "short squeeze",

	// crypto/tech positive
	"adoption", "integration", "ecosystem", "platform", "network effect",
	"moat", "switching cost", "first mover", "category leader", "market leader",
];

export const negativeWords = [
	// earnings & financials
	"miss", "loss", "deficit", "debt", "liability", "insolvency", "default",
	"writeoff", "impairment", "restatement", "fraud", "scandal", "fine",
	"penalty", "charge", "provisions", "bad loans", "npa", "npl",
	"goodwill impairment", "asset write-down", "negative cash flow",
	"cash burn", "working capital issue", "covenant breach", "credit risk",
	"revenue miss", "earnings miss", "profit warning", "guidance cut",
	"margin compression", "cost pressure", "interest burden", "debt trap",
	"overleveraged", "highly leveraged", "debt laden", "cash strapped",

	// decline
	"drop", "fall", "decline", "plunge", "crash", "collapse", "tumble",
	"slide", "sink", "slump", "dip", "retreat", "selloff", "dump",
	"freefall", "nosedive", "meltdown", "wipeout", "bloodbath", "rout",
	"correction", "bear market", "downtrend", "breakdown", "all-time low",
	"52-week low", "multi-year low", "fresh low", "new low", "tank",
	"implode", "devastate", "crater", "erode", "deteriorate", "worsen",
	"spiral", "unravel", "falter", "stumble", "stagnate", "flatline",

	// analyst actions
	"downgrade", "underperform", "underweight", "sell", "reduce", "cut",
	"bearish", "pessimistic", "concerned", "negative", "weak", "avoid",
	"price target cut", "price target lowered", "cautious", "neutral",
	"downside risk", "below expectations", "disappointing guidance",
	"strip rating", "suspended coverage", "not rated", "sell rated",
	"consensus cut", "estimate cut", "forecast lowered", "outlook weak",

	// legal & regulatory
	"lawsuit", "investigation", "probe", "recall", "ban", "sanction",
	"class action", "sec probe", "regulatory action", "ceo resign",
	"cfo resign", "management exodus", "whistleblower", "accounting irregularity",
	"going concern", "chapter 11", "chapter 7", "insolvency proceedings",
	"sebi notice", "income tax raid", "enforcement directorate", "cbi probe",
	"court order", "injunction", "stay order", "contempt", "indicted",
	"charged", "arrested", "convicted", "guilty", "violation", "breach",
	"non-compliance", "show cause", "blacklisted", "debarred", "suspended",

	// business operations
	"layoff", "restructure", "bankruptcy", "liquidation", "closure",
	"exit", "halt", "suspend", "delay", "cancel", "reject", "fail",
	"plant shutdown", "factory fire", "supply disruption", "product recall",
	"customer loss", "client exit", "contract termination", "deal collapse",
	"merger failed", "acquisition cancelled", "bid rejected", "hostile takeover",
	"management conflict", "board dispute", "promoter dispute", "shareholder fight",
	"strike", "lockout", "union dispute", "labour unrest", "worker protest",
	"supply chain disruption", "raw material shortage", "logistics failure",

	// macro & market
	"rate hike", "tightening", "inflation", "recession", "slowdown",
	"uncertainty", "volatility", "risk", "threat", "warning", "concern",
	"headwind", "pressure", "challenge", "struggle", "disappoint",
	"stagflation", "hyperinflation", "currency crisis", "currency depreciation",
	"sovereign debt", "credit crunch", "liquidity crisis", "contagion",
	"geopolitical", "war", "sanctions", "embargo", "trade war",
	"hard landing", "overheating", "bubble", "overvalued", "expensive",
	"fed hawkish", "rbi hawkish", "yield spike", "bond selloff",
	"dollar surge", "emerging market selloff", "capital outflow", "fii outflow",
	"crude spike", "oil shock", "commodity inflation", "food inflation",

	// sentiment & technical
	"overbought", "resistance", "death cross", "selling pressure",
	"institutional selling", "fii selling", "dii selling", "promoter selling",
	"stake sale", "insider selling", "short interest", "heavy shorting",
	"margin call", "forced selling", "panic selling", "circuit breaker",
	"lower circuit", "trade halt", "exchange suspension", "delisting",
	"index exclusion", "index removal", "etf selling", "passive outflow",

	// operational & strategic
	"cost overrun", "execution risk", "project delay", "capex blowout",
	"inventory buildup", "demand destruction", "pricing power loss",
	"customer churn", "subscriber loss", "market share loss", "competition intensifies",
	"price war", "commoditization", "disintermediation", "disruption threat",
	"obsolescence", "technology risk", "cyber attack", "data breach",
	"reputational damage", "brand damage", "recall cost", "remediation cost",
	"stranded asset", "write-down", "goodwill erosion", "intangible impairment",
];
