import Foundation

enum MockData {
    static let members: [GroupMember] = [
        GroupMember(
            id: "m1", name: "Team Lead", role: "Leader",
            skills: ["Navigation", "First Aid", "Comms"],
            status: .ready,
            phone: "555-0101",
            notes: "Primary decision maker. HAM radio licensed."
        ),
        GroupMember(
            id: "m2", name: "Medic", role: "Medical",
            skills: ["First Aid", "Trauma Care", "Herbalism"],
            status: .ready,
            phone: "555-0102",
            notes: "EMT certified. Maintains medical supplies."
        ),
        GroupMember(
            id: "m3", name: "Scout", role: "Recon",
            skills: ["Navigation", "Tracking", "Hunting"],
            status: .unknown,
            phone: "555-0103",
            notes: "Former military. Wilderness survival expert."
        ),
    ]

    /// Seed inventory — deliberately includes one expired item and one
    /// expiring soon so the alert system demos itself on first launch.
    static let seedSupplies: [SupplyItem] = [
        SupplyItem(
            id: "s_water_1", name: "Bottled Water", category: .water,
            quantity: 18, unit: "gal", minimumQuantity: 24,
            notes: "Garage rack — 6-pack cases",
            isSample: true
        ),
        SupplyItem(
            id: "s_water_2", name: "Sawyer Squeeze Filter", category: .water,
            quantity: 2, unit: "units", minimumQuantity: 1,
            notes: "Backflush kit taped to each filter",
            isSample: true
        ),
        SupplyItem(
            id: "s_food_1", name: "MRE Cases", category: .food,
            quantity: 4, unit: "cases", minimumQuantity: 2,
            expirationDate: "2026-09-15", notes: "Hall closet, top shelf",
            isSample: true
        ),
        SupplyItem(
            id: "s_food_2", name: "White Rice", category: .food,
            quantity: 25, unit: "lbs", minimumQuantity: 10,
            expirationDate: "2028-01", notes: "Food-grade buckets with gamma lids",
            isSample: true
        ),
        SupplyItem(
            id: "s_food_3", name: "Pinto Beans", category: .food,
            quantity: 20, unit: "lbs", minimumQuantity: 10,
            expirationDate: "2028-05", notes: "Buckets with oxygen absorbers",
            isSample: true
        ),
        SupplyItem(
            id: "s_food_4", name: "Canned Soup", category: .food,
            quantity: 24, unit: "cans", minimumQuantity: 12,
            expirationDate: "2027-06", notes: "Pantry shelf — rotate FIFO",
            isSample: true
        ),
        SupplyItem(
            id: "s_food_5", name: "Rolled Oats", category: .food,
            quantity: 12, unit: "lbs", minimumQuantity: 6,
            expirationDate: "2027-11", notes: "Mylar bags inside 5-gal bucket",
            isSample: true
        ),
        SupplyItem(
            id: "s_med_1", name: "Ibuprofen", category: .medical,
            quantity: 1, unit: "bottles", minimumQuantity: 2,
            expirationDate: "2026-03-01", notes: "Med kit — expired, replace",
            isSample: true
        ),
        SupplyItem(
            id: "s_med_2", name: "First Aid Kit — Large", category: .medical,
            quantity: 1, unit: "kits", minimumQuantity: 1,
            notes: "Trauma kit incl. tourniquets",
            isSample: true
        ),
        SupplyItem(
            id: "s_med_3", name: "Electrolyte Powder", category: .medical,
            quantity: 3, unit: "tubs", minimumQuantity: 2,
            expirationDate: "2026-10-15", notes: "Oral rehydration — check dose per liter",
            isSample: true
        ),
        SupplyItem(
            id: "s_tools_1", name: "AA Batteries", category: .tools,
            quantity: 48, unit: "count", minimumQuantity: 24,
            notes: "Rotate — flashlight stock",
            isSample: true
        ),
        SupplyItem(
            id: "s_tools_2", name: "Duct Tape", category: .tools,
            quantity: 4, unit: "rolls", minimumQuantity: 2,
            notes: "Garage pegboard",
            isSample: true
        ),
        SupplyItem(
            id: "s_comms_1", name: "FRS Two-Way Radios", category: .comms,
            quantity: 6, unit: "units", minimumQuantity: 4,
            notes: "Charged monthly — see Comms tab channels",
            isSample: true
        ),
        SupplyItem(
            id: "s_shelter_1", name: "Tarps — 10×12", category: .shelter,
            quantity: 4, unit: "units", minimumQuantity: 2,
            notes: "With grommets + bungee assortment",
            isSample: true
        ),
    ]

    static let checklists: [Checklist] = [
        Checklist(
            id: "cl1", title: "Bug-Out Bag",
            description: "72-hour emergency go-bag essentials",
            icon: "backpack",
            items: [
                ChecklistItem(id: "cl1-1", text: "Water — 1 gallon per person per day (3 day supply)", completed: false),
                ChecklistItem(id: "cl1-2", text: "Water purification tablets or filter", completed: false),
                ChecklistItem(id: "cl1-3", text: "Food — 3 day supply of non-perishable items", completed: false),
                ChecklistItem(id: "cl1-4", text: "First aid kit", completed: false),
                ChecklistItem(id: "cl1-5", text: "Flashlight + extra batteries", completed: false),
                ChecklistItem(id: "cl1-6", text: "Multi-tool or knife", completed: false),
                ChecklistItem(id: "cl1-7", text: "Fire-starting kit (lighter, matches, ferro rod)", completed: false),
                ChecklistItem(id: "cl1-8", text: "Emergency blanket / poncho", completed: false),
                ChecklistItem(id: "cl1-9", text: "Change of clothes + sturdy footwear", completed: false),
                ChecklistItem(id: "cl1-10", text: "Important documents (copies)", completed: false),
                ChecklistItem(id: "cl1-11", text: "Cash in small denominations", completed: false),
                ChecklistItem(id: "cl1-12", text: "Two-way radio + extra batteries", completed: false),
                ChecklistItem(id: "cl1-13", text: "Local and regional maps", completed: false),
                ChecklistItem(id: "cl1-14", text: "Paracord (50 ft minimum)", completed: false),
                ChecklistItem(id: "cl1-15", text: "Duct tape (small roll)", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl2", title: "Shelter-In-Place",
            description: "Securing your home for extended grid-down",
            icon: "house",
            items: [
                ChecklistItem(id: "cl2-1", text: "Secure all entry points", completed: false),
                ChecklistItem(id: "cl2-2", text: "Fill all bathtubs & containers with water", completed: false),
                ChecklistItem(id: "cl2-3", text: "Inventory all food and supplies", completed: false),
                ChecklistItem(id: "cl2-4", text: "Charge all devices and battery banks", completed: false),
                ChecklistItem(id: "cl2-5", text: "Set up communication plan with group", completed: false),
                ChecklistItem(id: "cl2-6", text: "Establish watch/security rotation", completed: false),
                ChecklistItem(id: "cl2-7", text: "Brief all household members on plan", completed: false),
                ChecklistItem(id: "cl2-8", text: "Locate and test all flashlights/lanterns", completed: false),
                ChecklistItem(id: "cl2-9", text: "Prepare cooking method (camp stove, grill)", completed: false),
                ChecklistItem(id: "cl2-10", text: "Secure important documents", completed: false),
                ChecklistItem(id: "cl2-11", text: "Prepare sanitation supplies", completed: false),
                ChecklistItem(id: "cl2-12", text: "Check generator fuel / solar chargers", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl3", title: "Comms Plan",
            description: "Communication protocols and check-ins",
            icon: "antenna.radiowaves.left.and.right",
            items: [
                ChecklistItem(id: "cl3-1", text: "Assign primary radio channel", completed: false),
                ChecklistItem(id: "cl3-2", text: "Assign backup radio channel", completed: false),
                ChecklistItem(id: "cl3-3", text: "Set check-in times (0800, 1200, 2000)", completed: false),
                ChecklistItem(id: "cl3-4", text: "Establish code words", completed: false),
                ChecklistItem(id: "cl3-5", text: "Designate rally point Alpha", completed: false),
                ChecklistItem(id: "cl3-6", text: "Designate rally point Bravo", completed: false),
                ChecklistItem(id: "cl3-7", text: "Test all radios and spare batteries", completed: false),
                ChecklistItem(id: "cl3-8", text: "Print contact list for all members", completed: false),
                ChecklistItem(id: "cl3-9", text: "Establish signal plan (visual/audible)", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl4", title: "Vehicle Readiness",
            description: "Vehicle prep for emergency evacuation",
            icon: "car.fill",
            items: [
                ChecklistItem(id: "cl4-1", text: "Fuel tank at least 3/4 full", completed: false),
                ChecklistItem(id: "cl4-2", text: "Spare fuel containers filled", completed: false),
                ChecklistItem(id: "cl4-3", text: "Check tire pressure and spare", completed: false),
                ChecklistItem(id: "cl4-4", text: "Emergency kit in vehicle", completed: false),
                ChecklistItem(id: "cl4-5", text: "Maps of primary and alternate routes", completed: false),
                ChecklistItem(id: "cl4-6", text: "Jumper cables / jump starter", completed: false),
                ChecklistItem(id: "cl4-7", text: "Basic tool kit", completed: false),
                ChecklistItem(id: "cl4-8", text: "Tow strap", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl5", title: "First Aid Kit",
            description: "Trauma-ready medical kit contents",
            icon: "cross.case.fill",
            items: [
                ChecklistItem(id: "cl5-1", text: "Assorted adhesive bandages", completed: false),
                ChecklistItem(id: "cl5-2", text: "Sterile gauze pads + rolled gauze", completed: false),
                ChecklistItem(id: "cl5-3", text: "Medical tape", completed: false),
                ChecklistItem(id: "cl5-4", text: "Tourniquet (CAT style)", completed: false),
                ChecklistItem(id: "cl5-5", text: "Hemostatic (clotting) gauze", completed: false),
                ChecklistItem(id: "cl5-6", text: "Antiseptic wipes + antibiotic ointment", completed: false),
                ChecklistItem(id: "cl5-7", text: "Pain relievers, antihistamines, anti-diarrheal", completed: false),
                ChecklistItem(id: "cl5-8", text: "Trauma shears + tweezers", completed: false),
                ChecklistItem(id: "cl5-9", text: "Nitrile gloves", completed: false),
                ChecklistItem(id: "cl5-10", text: "CPR face shield", completed: false),
                ChecklistItem(id: "cl5-11", text: "Digital thermometer", completed: false),
                ChecklistItem(id: "cl5-12", text: "30-day supply of personal prescriptions", completed: false),
                ChecklistItem(id: "cl5-13", text: "First aid reference manual", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl6", title: "Water Storage",
            description: "Two-week minimum water reserve",
            icon: "drop.fill",
            items: [
                ChecklistItem(id: "cl6-1", text: "1 gallon per person per day × 14 days", completed: false),
                ChecklistItem(id: "cl6-2", text: "Food-grade containers only, clearly labeled", completed: false),
                ChecklistItem(id: "cl6-3", text: "Treat tap water with 8 drops bleach per gallon", completed: false),
                ChecklistItem(id: "cl6-4", text: "Rotate stored water every 6 months", completed: false),
                ChecklistItem(id: "cl6-5", text: "Store away from sunlight and chemicals", completed: false),
                ChecklistItem(id: "cl6-6", text: "Know water heater drain valve (30-50 gal reserve)", completed: false),
                ChecklistItem(id: "cl6-7", text: "Collapsible containers for hauling", completed: false),
                ChecklistItem(id: "cl6-8", text: "Backup purification (filter + tablets)", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl7", title: "Sanitation Kit",
            description: "Stay healthy when plumbing is down",
            icon: "hands.sparkles.fill",
            items: [
                ChecklistItem(id: "cl7-1", text: "5-gal bucket with toilet seat lid", completed: false),
                ChecklistItem(id: "cl7-2", text: "Heavy-duty trash bag liners", completed: false),
                ChecklistItem(id: "cl7-3", text: "Kitty litter, lime, or sawdust", completed: false),
                ChecklistItem(id: "cl7-4", text: "Soap + 60%+ alcohol hand sanitizer", completed: false),
                ChecklistItem(id: "cl7-5", text: "Toilet paper + feminine hygiene supplies", completed: false),
                ChecklistItem(id: "cl7-6", text: "Unscented bleach + disinfectant", completed: false),
                ChecklistItem(id: "cl7-7", text: "Nitrile gloves", completed: false),
                ChecklistItem(id: "cl7-8", text: "Wash basins + baby wipes", completed: false),
                ChecklistItem(id: "cl7-9", text: "Toothbrushes + baking soda toothpaste", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
        Checklist(
            id: "cl8", title: "Generator & Power",
            description: "Backup power readiness and safety",
            icon: "bolt.fill",
            items: [
                ChecklistItem(id: "cl8-1", text: "Generator runs — test monthly under load", completed: false),
                ChecklistItem(id: "cl8-2", text: "Fuel stored + stabilized, rotated 6-12 months", completed: false),
                ChecklistItem(id: "cl8-3", text: "Spare oil, filter, spark plug", completed: false),
                ChecklistItem(id: "cl8-4", text: "Heavy-duty extension cords (outdoor rated)", completed: false),
                ChecklistItem(id: "cl8-5", text: "Transfer switch installed (no backfeeding)", completed: false),
                ChecklistItem(id: "cl8-6", text: "Battery CO detector near sleeping areas", completed: false),
                ChecklistItem(id: "cl8-7", text: "Solar panel + charge controller", completed: false),
                ChecklistItem(id: "cl8-8", text: "Battery bank charged (LiFePO4 preferred)", completed: false),
                ChecklistItem(id: "cl8-9", text: "12V inverter for vehicle charging", completed: false),
                ChecklistItem(id: "cl8-10", text: "Charging cables for radios, phones, lights", completed: false),
            ],
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        ),
    ]

    static let commsChannels: [CommsChannel] = [
        CommsChannel(id: "ch1", name: "PRIMARY", band: .FRS, frequency: "462.5625 MHz", mode: .simplex, purpose: "Main group communications", ctcssTone: "141.3 Hz", power: "2W", notes: "Channel 1 FRS - Default rally channel", isPrimary: true),
        CommsChannel(id: "ch2", name: "SECONDARY", band: .FRS, frequency: "462.5875 MHz", mode: .simplex, purpose: "Backup if primary compromised", ctcssTone: "141.3 Hz", power: "2W", notes: "Channel 2 FRS - Fallback"),
        CommsChannel(id: "ch3", name: "EMERGENCY", band: .FRS, frequency: "462.6750 MHz", mode: .simplex, purpose: "Emergency traffic only", ctcssTone: "167.9 Hz", power: "2W", notes: "Channel 5 FRS - Emergency use only"),
        CommsChannel(id: "ch4", name: "OVERWATCH", band: .GMRS, frequency: "462.5500 MHz", mode: .simplex, purpose: "Long-range scout/recon comms", power: "5W", notes: "GMRS license required"),
        CommsChannel(id: "ch5", name: "CONVOY", band: .CB, frequency: "27.185 MHz", mode: .simplex, purpose: "Vehicle convoy coordination", power: "4W SSB", notes: "CB Channel 19 - Standard road channel"),
        CommsChannel(id: "ch6", name: "MURS NET", band: .MURS, frequency: "151.820 MHz", mode: .simplex, purpose: "Low-profile local comms", power: "2W", notes: "MURS Ch1 - No license required, less monitored"),
    ]

    static let commsRepeaters: [CommsRepeater] = [
        CommsRepeater(id: "rpt1", name: "HILLTOP-1", inputFreq: "462.5500 MHz", outputFreq: "467.5500 MHz", offset: "+5.0 MHz", ctcssTone: "103.5 Hz", location: "Ridge Point Elevation 1240ft", range: "~15 mi radius", notes: "Solar powered GMRS repeater"),
    ]

    static let commsProtocols: [CommsProtocol] = [
        CommsProtocol(id: "proto1", title: "Radio Check Procedure", description: "Standard procedure to verify comms link with group members", steps: [
            "Key mic, pause 1 second before speaking",
            "Say: \"[Your callsign], radio check, over\"",
            "Wait for response: \"[Responder callsign], read you [1-5], over\"",
            "Acknowledge: \"[Your callsign], roger, out\"",
            "If no response after 30 sec, try secondary channel",
            "If still no response, attempt MURS fallback",
        ]),
        CommsProtocol(id: "proto2", title: "Emergency Beacon", description: "Distress signal protocol when member needs immediate help", steps: [
            "Switch to EMERGENCY channel (Ch 5 FRS)",
            "Key mic 3 times rapidly (break-break-break)",
            "Say: \"MAYDAY MAYDAY MAYDAY, [callsign], [nature of emergency]\"",
            "Provide location: grid reference or landmarks",
            "State number of persons and injuries",
            "Say: \"[callsign], standing by, over\"",
            "Repeat every 2 minutes until acknowledged",
        ]),
        CommsProtocol(id: "proto3", title: "Scheduled Net Call", description: "Regular check-in to confirm all members operational", steps: [
            "Net control initiates on PRIMARY at scheduled time",
            "Say: \"All stations, all stations, this is [net control callsign], net call, over\"",
            "Each member responds in assigned order with status",
            "Format: \"[callsign], [status: green/amber/red], [location], over\"",
            "Net control acknowledges each station",
            "Close net: \"All stations, net control, net closed, out\"",
            "Missing stations trigger welfare check protocol",
        ]),
        CommsProtocol(id: "proto4", title: "Mesh Network Relay", description: "Extending range through multi-hop relay when direct LOS fails", steps: [
            "Identify relay-capable stations between origin and destination",
            "Origin sends: \"[destination callsign] via [relay callsign], [message], over\"",
            "Relay station repeats verbatim to destination",
            "Destination acknowledges to relay, relay confirms to origin",
            "Keep messages short - under 15 seconds",
            "Use brevity codes when possible (see reference card)",
        ]),
        CommsProtocol(id: "proto5", title: "Line-of-Sight Assessment", description: "Evaluate terrain for direct radio communication feasibility", steps: [
            "Identify elevation of transmit and receive positions",
            "Calculate LOS distance: D(mi) ≈ 1.23 × (√h1 + √h2) where h = height in feet",
            "Check for terrain obstructions between stations",
            "Account for Fresnel zone clearance (60% minimum)",
            "VHF/UHF: Requires near-clear LOS path",
            "If obstructed: Position relay on high ground or use repeater",
            "Test with low power first, increase only if needed",
        ]),
        CommsProtocol(id: "proto6", title: "Brevity Codes & Prowords", description: "Standard reference card — phonetic alphabet and prowords for short, unambiguous transmissions", steps: [
            "Phonetic alphabet: Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu",
            "Numbers: speak digit by digit — \"one-two-three\", decimals as \"point\" (\"one-two-point-five\")",
            "OVER = my transmission is ended, respond",
            "OUT = conversation is ended (never say \"over and out\")",
            "ROGER = received and understood · WILCO = received and will comply",
            "SAY AGAIN = repeat your last transmission · I SAY AGAIN = I am repeating",
            "STANDBY = wait, I will call you back · WAIT OUT = lengthy pause expected",
            "BREAK = separating parts of a message or ending one message to start another",
            "NEGATIVE / AFFIRMATIVE = no / yes",
            "Readability scale: 1 = unreadable, 3 = readable with difficulty, 5 = perfectly readable",
        ]),
    ]

    static let guides: [Guide] = [
        Guide(id: "g1", title: "Water Purification", category: "Survival", icon: "drop.fill", summary: "Methods to make water safe for drinking when municipal water is unavailable.", sections: [
            GuideSection(title: "Boiling", content: "Bring water to a rolling boil for at least 1 minute (3 minutes above 6,500 feet elevation). This is the most reliable method to kill pathogens. Let cool before drinking. Store in clean, sanitized containers."),
            GuideSection(title: "Chemical Treatment", content: "Use unscented liquid household bleach (5-9% sodium hypochlorite). Add 8 drops per gallon of clear water, or 16 drops for cloudy water. Stir and let stand 30 minutes. Water should have a slight chlorine smell."),
            GuideSection(title: "Filtration", content: "Portable water filters rated to 0.2 microns remove most bacteria and protozoa. Gravity filters work without power. Always have backup filtration. Pre-filter cloudy water through cloth first."),
            GuideSection(title: "Solar Disinfection (SODIS)", content: "Fill clear PET bottles with water. Place in direct sunlight for 6+ hours (2 days if cloudy). UV radiation kills pathogens. Only works with clear water in clear bottles. Good backup method."),
        ]),
        Guide(id: "g2", title: "First Aid Essentials", category: "Medical", icon: "heart.fill", summary: "Critical first aid procedures when professional medical help is unavailable.", sections: [
            GuideSection(title: "Bleeding Control", content: "Apply direct pressure with clean cloth. Elevate wound above heart if possible. For severe bleeding, apply tourniquet 2-3 inches above wound. Note time of application. Do not remove once applied — seek medical help."),
            GuideSection(title: "Wound Care", content: "Clean wounds with clean water. Remove debris carefully. Apply antibiotic ointment. Cover with sterile dressing. Change dressing daily. Watch for signs of infection: redness, swelling, warmth, pus, red streaks."),
            GuideSection(title: "Burns", content: "Cool burn with cool (not cold) running water for 10-20 minutes. Do not apply ice, butter, or toothpaste. Cover with sterile non-stick dressing. For severe burns, cover loosely and seek help. Watch for shock."),
            GuideSection(title: "CPR Basics", content: "Check responsiveness. Call for help. Place heel of hand on center of chest. Push hard and fast — 2 inches deep, 100-120 compressions per minute. Give 2 rescue breaths after every 30 compressions. Continue until help arrives."),
        ]),
        Guide(id: "g3", title: "Emergency Communications", category: "Comms", icon: "antenna.radiowaves.left.and.right", summary: "How to establish and maintain communications when normal infrastructure fails.", sections: [
            GuideSection(title: "Two-Way Radios", content: "FRS radios work up to 2 miles in open terrain (less in urban areas). GMRS radios offer better range (up to 5+ miles) but require a license. Establish primary and backup channels. Set scheduled check-in times."),
            GuideSection(title: "Signal Methods", content: "Whistle: 3 blasts = distress. Mirror: flash toward aircraft or distant persons. Smoke: use green vegetation on fire for white smoke. Ground signals: large X = need help, V = need assistance, arrow = traveling this direction."),
            GuideSection(title: "Message Protocols", content: "Keep messages brief and clear. Use phonetic alphabet for spelling. Repeat critical information. Establish code words for sensitive information. Use \"over\" to indicate end of transmission, \"out\" to end conversation."),
            GuideSection(title: "Dead Drops & Rally Points", content: "Pre-designate physical locations for leaving messages. Use waterproof containers. Establish check schedules. Mark with subtle indicators. Have primary and alternate locations. Include date/time on all messages."),
        ]),
        Guide(id: "g4", title: "Shelter & Warmth", category: "Survival", icon: "house.fill", summary: "Building emergency shelter and maintaining body temperature in adverse conditions.", sections: [
            GuideSection(title: "Shelter Priorities", content: "Protection from wind, rain, and ground cold. Insulation above and below. Small shelters retain heat better. Face opening away from prevailing wind. Locate near water source but above flood level."),
            GuideSection(title: "Emergency Shelters", content: "Tarp shelter: ridgeline between two trees, tarp draped over at 45 degrees. Debris hut: ridgepole on ground support, pile leaves/branches 2-3 feet thick. Vehicle: park outdoors away from drifts, clear snow from the exhaust pipe before starting, crack a downwind window, and run the engine only 10 minutes per hour — recheck that the exhaust stays clear each time. Never run the engine in a garage or enclosed space, and never sleep with it running: carbon monoxide is odorless and deadly."),
            GuideSection(title: "Hypothermia Prevention", content: "Layer clothing: base (wicking), mid (insulation), outer (wind/water). Keep dry — change wet clothes immediately. Stay active but conserve energy. Eat high-calorie foods. Share body heat in emergency."),
        ]),
        Guide(id: "g5", title: "Food Preservation", category: "Supplies", icon: "leaf.fill", summary: "Techniques for preserving food without refrigeration during extended grid-down scenarios.", sections: [
            GuideSection(title: "Salt Curing", content: "Cover meat completely in salt (1 lb salt per 4 lbs meat). Store in cool, dry place. Rinse and soak in water before cooking to remove excess salt. Properly cured meat can last months without refrigeration."),
            GuideSection(title: "Smoking", content: "Build a smoke chamber or use enclosed grill. Maintain low heat (100-150 degrees F) with hardwood smoke. Cold smoking for preservation, hot smoking for cooking. Takes 12-24 hours. Combine with salt curing for best results."),
            GuideSection(title: "Dehydration", content: "Slice food thin and uniform. Sun dry on clean screens in hot, dry weather. Can improvise solar dehydrator with car windshield. Properly dried food should be brittle. Store in airtight containers."),
            GuideSection(title: "Root Cellaring", content: "Store root vegetables in cool (32-40 degrees F), humid, dark conditions. Layer in sand or sawdust. Separate ethylene-producing items (apples) from sensitive items (potatoes). Check regularly for spoilage."),
        ]),
        Guide(id: "g7", title: "Sanitation & Hygiene", category: "Survival", icon: "hands.sparkles.fill", summary: "Preventing disease when plumbing and trash service are gone — unsafe sanitation is the #1 killer after disasters.", sections: [
            GuideSection(title: "Hand Hygiene", content: "Wash hands with soap and water for 20 seconds before eating, after waste handling, and before treating wounds. When soap runs out, use ash and water, then 60%+ alcohol sanitizer. Hand hygiene prevents more illness than any other measure."),
            GuideSection(title: "Human Waste", content: "Line a 5-gallon bucket with heavy trash bags; add a scoop of kitty litter, lime, or sawdust after each use and seal the bag when full. Bury in a cat-hole 6-8 inches deep, at least 200 feet from any water source. Never bury waste near wells or gardens."),
            GuideSection(title: "Greywater & Trash", content: "Dump dish and wash water at least 100 feet from streams, wells, and gardens. Bury food scraps deep or they attract rodents. Burn or bury refuse rather than letting it pile up and breed flies."),
            GuideSection(title: "Keeping Clean", content: "Take sponge baths with a basin of warm water instead of showers. Keep feet dry and change socks daily — trench foot disables more people than combat. Brush with baking soda or salt when toothpaste is gone."),
            GuideSection(title: "Disease Watch", content: "Diarrhea is the top post-disaster killer. Anyone with symptoms should isolate, drink only boiled or treated water, and rehydrate aggressively with oral rehydration solution (1 liter water, 6 tsp sugar, 1/2 tsp salt). Escalate if symptoms last more than 3 days."),
        ]),
        Guide(id: "g8", title: "Backup Power", category: "Supplies", icon: "powerplug.fill", summary: "Generators, solar, and battery banks — keeping critical devices powered safely when the grid is down.", sections: [
            GuideSection(title: "Generator Safety", content: "Never run a generator indoors, in a garage, or within 20 feet of a window or vent — carbon monoxide kills silently. Keep it dry under an open canopy. Never back-feed house wiring without a proper transfer switch; it can electrocute line workers."),
            GuideSection(title: "Fuel Storage & Rotation", content: "Store gasoline in approved containers away from living spaces, with fuel stabilizer, and rotate every 6-12 months by using it in your vehicle. A typical portable generator burns 0.5-1 gallon per hour at load — plan reserves accordingly."),
            GuideSection(title: "Solar Charging", content: "A 100-200W panel with a charge controller covers phones, radios, and lights indefinitely. Clean panels and re-aim them at midday for best output. Expect 30-50% less production in winter or heavy overcast."),
            GuideSection(title: "Battery Banks", content: "LiFePO4 batteries last far longer than lead-acid and tolerate partial charging. Size your bank to your loads: radios, LED lights, and phone charging typically need 300-500Wh per day for a small group. Keep banks charged and above freezing."),
            GuideSection(title: "Conservation First", content: "The cheapest watt is the one you never use. Run LED task lighting instead of room lighting, cool with shade and airflow before powered cooling, and charge devices in batches rather than continuously."),
        ]),
        Guide(id: "g6", title: "Security & Watch Protocols", category: "Security", icon: "shield.fill", summary: "Establishing a security posture and watch schedule for your group.", sections: [
            GuideSection(title: "Watch Schedule", content: "Minimum 2-person watches. 4-hour shifts maximum at night. Rotate positions. Maintain a watch log. Brief incoming watch on current situation. Establish clear alert escalation procedures."),
            GuideSection(title: "Perimeter Awareness", content: "Identify natural choke points and avenues of approach. Clear lines of sight where possible. Use noise makers (cans with pebbles on wire) as early warning. Designate safe rooms and rally points."),
            GuideSection(title: "Conflict De-escalation", content: "Project calm confidence. Maintain safe distance. Listen actively. Offer alternatives. Never turn your back. Have backup nearby but not threatening. Document encounters. Avoid confrontation when possible."),
        ]),
    ]

    static let infrastructurePois: [POI] = [
        // Gas Stations
        POI(id: "infra-gas-1", name: "QuikTrip Gas Station", category: .gasStation, coordinates: Coordinates(latitude: 38.6270, longitude: -90.1994), notes: "24hr fuel, propane exchange available", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-gas-2", name: "Casey's General Store", category: .gasStation, coordinates: Coordinates(latitude: 38.6350, longitude: -90.2050), notes: "Diesel and regular fuel, convenience store", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-gas-3", name: "Shell Station — Hwy 44", category: .gasStation, coordinates: Coordinates(latitude: 38.6170, longitude: -90.2150), notes: "Diesel, kerosene, air pump. Trucks welcome.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Hospitals & Medical
        POI(id: "infra-hosp-1", name: "Regional Medical Center", category: .hospital, coordinates: Coordinates(latitude: 38.6310, longitude: -90.1920), notes: "Level II trauma center, ER open 24/7", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-hosp-2", name: "Community Health Clinic", category: .hospital, coordinates: Coordinates(latitude: 38.6220, longitude: -90.2100), notes: "Urgent care, Mon-Sat 8am-8pm", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-hosp-3", name: "St. Louis Children's Hospital", category: .hospital, coordinates: Coordinates(latitude: 38.6360, longitude: -90.2630), notes: "Pediatric emergency, NICU, 24/7", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-med-1", name: "VA Medical Center", category: .medical, coordinates: Coordinates(latitude: 38.6420, longitude: -90.2640), notes: "Veterans health, emergency and mental health services", createdAt: "2024-01-01T00:00:00.000Z"),
        // Pharmacies
        POI(id: "infra-pharm-1", name: "Walgreens Pharmacy", category: .pharmacy, coordinates: Coordinates(latitude: 38.6290, longitude: -90.2030), notes: "Prescription meds, first aid supplies, OTC stock", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-pharm-2", name: "CVS Pharmacy", category: .pharmacy, coordinates: Coordinates(latitude: 38.6340, longitude: -90.1950), notes: "Drive-through pharmacy, 24hr location", createdAt: "2024-01-01T00:00:00.000Z"),
        // Police
        POI(id: "infra-police-1", name: "City Police Department", category: .police, coordinates: Coordinates(latitude: 38.6240, longitude: -90.1960), notes: "Main precinct, dispatch center", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-police-2", name: "County Sheriff Substation", category: .police, coordinates: Coordinates(latitude: 38.6480, longitude: -90.2300), notes: "Patrol dispatch, evidence storage, holding cells", createdAt: "2024-01-01T00:00:00.000Z"),
        // Fire Stations
        POI(id: "infra-fire-1", name: "Fire Station #3", category: .fireStation, coordinates: Coordinates(latitude: 38.6330, longitude: -90.1890), notes: "Engine and ladder company, EMS response", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-fire-2", name: "Fire Station #7", category: .fireStation, coordinates: Coordinates(latitude: 38.6180, longitude: -90.2080), notes: "Rescue squad, hazmat team", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "infra-fire-3", name: "Fire Station #12", category: .fireStation, coordinates: Coordinates(latitude: 38.6550, longitude: -90.2410), notes: "Wildland-urban interface unit, water tender", createdAt: "2024-01-01T00:00:00.000Z"),
    ]

    static let tacticalPois: [POI] = [
        // Rally Points
        POI(id: "tac-rally-1", name: "Rally Point Alpha", category: .rallyPoint, coordinates: Coordinates(latitude: 38.6280, longitude: -90.1980), notes: "Primary meetup — Forest Park SE parking. Open area, multiple access roads, visible landmarks.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-rally-2", name: "Rally Point Bravo", category: .rallyPoint, coordinates: Coordinates(latitude: 38.6410, longitude: -90.2250), notes: "Alternate meetup — Tower Grove Park pavilion. Covered shelter, secondary egress.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-rally-3", name: "Rally Point Charlie", category: .rallyPoint, coordinates: Coordinates(latitude: 38.6150, longitude: -90.2300), notes: "Emergency fallback — Carondelet Park south entrance. Low traffic, concealed from main roads.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-rally-4", name: "Bug-Out Staging Area", category: .rallyPoint, coordinates: Coordinates(latitude: 38.6600, longitude: -90.2500), notes: "Final muster before evacuation — I-44 on-ramp lot. Load vehicles, distribute supplies, headcount.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Water Sources
        POI(id: "tac-water-1", name: "Mississippi River Intake", category: .water, coordinates: Coordinates(latitude: 38.6200, longitude: -90.1800), notes: "River access point. Water MUST be filtered and purified. Sand pre-filter recommended.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-water-2", name: "Forest Park Lake", category: .water, coordinates: Coordinates(latitude: 38.6295, longitude: -90.2010), notes: "Surface water lake. Boil or filter before drinking. Fishing possible. Rain-fed.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-water-3", name: "Artesian Well — City Park", category: .water, coordinates: Coordinates(latitude: 38.6370, longitude: -90.2380), notes: "Natural spring-fed well. Historically potable but test before drinking. Bring containers.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-water-4", name: "Water Treatment Plant", category: .water, coordinates: Coordinates(latitude: 38.6100, longitude: -90.1900), notes: "Municipal water plant. May have emergency potable water during early stages of grid-down.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-water-5", name: "Rainwater Collection Rooftop", category: .water, coordinates: Coordinates(latitude: 38.6315, longitude: -90.2150), notes: "Pre-identified flat rooftop with gutter system. Deploy tarps and collection barrels.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Shelters
        POI(id: "tac-shelter-1", name: "Community Center Shelter", category: .shelter, coordinates: Coordinates(latitude: 38.6260, longitude: -90.2180), notes: "Designated emergency shelter. Capacity ~200. Backup generator. Kitchen facilities.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-shelter-2", name: "St. Mark's Church", category: .shelter, coordinates: Coordinates(latitude: 38.6390, longitude: -90.2310), notes: "Basement shelter, reinforced. Capacity ~80. Has well water access and emergency radio.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-shelter-3", name: "School Gymnasium — Jefferson", category: .shelter, coordinates: Coordinates(latitude: 38.6190, longitude: -90.2240), notes: "Gym with showers and locker rooms. Fenced perimeter. Capacity ~150.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Supply Caches
        POI(id: "tac-cache-1", name: "Cache Alpha — Buried", category: .supplyCache, coordinates: Coordinates(latitude: 38.6275, longitude: -90.2045), notes: "PVC pipe cache, 3ft deep. Contents: 5 gal water, MREs (7-day), ammo, medical kit, fire starter.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-cache-2", name: "Cache Bravo — Attic", category: .supplyCache, coordinates: Coordinates(latitude: 38.6430, longitude: -90.2190), notes: "Residential attic stash. Contents: radio batteries, cash, documents copies, maps, spare medication.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-cache-3", name: "Cache Charlie — Vehicle", category: .supplyCache, coordinates: Coordinates(latitude: 38.6300, longitude: -90.2100), notes: "Truck-mounted go-bag. Contents: 72-hr food/water, trauma kit, tool kit, tarp, cordage.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Comms Points
        POI(id: "tac-comms-1", name: "Comms Relay — Hilltop", category: .comms, coordinates: Coordinates(latitude: 38.6600, longitude: -90.2000), notes: "Highest elevation in area (~450ft). VHF/UHF line-of-sight to most of metro. Deploy portable mast.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-comms-2", name: "Comms Relay — Water Tower", category: .comms, coordinates: Coordinates(latitude: 38.6320, longitude: -90.2450), notes: "Base of water tower. Good ground plane for HF vertical antenna. Power line nearby.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-comms-3", name: "Dead Drop — Bridge Abutment", category: .comms, coordinates: Coordinates(latitude: 38.6210, longitude: -90.2280), notes: "Pre-arranged message drop point. Waterproof container under bridge. Check every 48hrs at 0600.", createdAt: "2024-01-01T00:00:00.000Z"),
        // Hazards
        POI(id: "tac-hazard-1", name: "Chemical Plant — Evacuation Zone", category: .hazard, coordinates: Coordinates(latitude: 38.6050, longitude: -90.1750), notes: "Industrial chemical storage. Downwind hazard if breached. Maintain 1-mile buffer.", createdAt: "2024-01-01T00:00:00.000Z"),
        POI(id: "tac-hazard-2", name: "Flood-Prone Underpass", category: .hazard, coordinates: Coordinates(latitude: 38.6180, longitude: -90.2000), notes: "Low-lying underpass. Impassable during heavy rain (2+ inches). Plan alternate route.", createdAt: "2024-01-01T00:00:00.000Z"),
    ]

    static let allSeedPois: [POI] = infrastructurePois + tacticalPois

    static let defaultRoutes: [Route] = [
        Route(id: "route-default-evac-1", name: "Bug-Out Route Alpha (West)", color: "#D4822A", waypoints: [
            Coordinates(latitude: 38.6280, longitude: -90.1980),
            Coordinates(latitude: 38.6300, longitude: -90.2100),
            Coordinates(latitude: 38.6400, longitude: -90.2400),
            Coordinates(latitude: 38.6600, longitude: -90.2500),
            Coordinates(latitude: 38.6800, longitude: -90.2700),
        ], notes: "Primary evacuation west via I-44. Avoids downtown and chemical plant zone. Ends at rural staging area.", createdAt: "2024-01-01T00:00:00.000Z"),
        Route(id: "route-default-evac-2", name: "Bug-Out Route Bravo (South)", color: "#4A90D9", waypoints: [
            Coordinates(latitude: 38.6280, longitude: -90.1980),
            Coordinates(latitude: 38.6150, longitude: -90.2050),
            Coordinates(latitude: 38.6000, longitude: -90.2150),
            Coordinates(latitude: 38.5800, longitude: -90.2300),
            Coordinates(latitude: 38.5500, longitude: -90.2500),
        ], notes: "Alternate evacuation south via I-55. Use if I-44 is compromised. Passes near water source intake.", createdAt: "2024-01-01T00:00:00.000Z"),
        Route(id: "route-default-supply-1", name: "Supply Run — Medical & Pharmacy", color: "#CC3333", waypoints: [
            Coordinates(latitude: 38.6280, longitude: -90.1980),
            Coordinates(latitude: 38.6310, longitude: -90.1920),
            Coordinates(latitude: 38.6290, longitude: -90.2030),
            Coordinates(latitude: 38.6340, longitude: -90.1950),
            Coordinates(latitude: 38.6280, longitude: -90.1980),
        ], notes: "Loop route: Rally Alpha → Hospital → Walgreens → CVS → back. Total ~6 miles.", createdAt: "2024-01-01T00:00:00.000Z"),
        Route(id: "route-default-recon-1", name: "Recon Patrol — Perimeter", color: "#4CAF50", waypoints: [
            Coordinates(latitude: 38.6280, longitude: -90.1980),
            Coordinates(latitude: 38.6480, longitude: -90.1900),
            Coordinates(latitude: 38.6500, longitude: -90.2200),
            Coordinates(latitude: 38.6400, longitude: -90.2450),
            Coordinates(latitude: 38.6200, longitude: -90.2400),
            Coordinates(latitude: 38.6100, longitude: -90.2100),
            Coordinates(latitude: 38.6280, longitude: -90.1980),
        ], notes: "7-point perimeter patrol covering key infrastructure and observation points. ~18 miles.", createdAt: "2024-01-01T00:00:00.000Z"),
    ]

    /// Curated offline library catalog. All entries point at real ZIM files
    /// hosted on download.kiwix.org (verified via the library.kiwix.org OPDS
    /// catalog). sizeBytes are the exact server-reported content lengths.
    static let kiwixCatalog: [KiwixResource] = [
        KiwixResource(id: "kiwix-medical-wikipedia", title: "WikiMed Medical Encyclopedia (Full)", category: .medical, description: "The largest offline medical encyclopedia — 360,000+ Wikipedia medical articles with images: diseases, treatments, anatomy, pharmacology, and emergency procedures.", sizeLabel: "2.1 GB", downloadUrl: "https://download.kiwix.org/zim/wikipedia/wikipedia_en_medicine_maxi_2026-04.zim", language: "English", lastUpdated: "2026-04-11", tags: ["first aid", "diseases", "treatments", "anatomy", "pharmacology"], status: .available, sizeBytes: 2215521280, infoUrl: "https://browse.library.kiwix.org/content/wikipedia_en_medicine_maxi_2026-04"),
        KiwixResource(id: "kiwix-medical-wikimed-mini", title: "WikiMed Medical Encyclopedia (Mini)", category: .medical, description: "Compact version of the WikiMed encyclopedia — lead sections of all medical articles, no images. Ideal first download when bandwidth is limited.", sizeLabel: "155 MB", downloadUrl: "https://download.kiwix.org/zim/wikipedia/wikipedia_en_medicine_mini_2026-04.zim", language: "English", lastUpdated: "2026-04-11", tags: ["first aid", "quick reference", "low bandwidth", "emergency medicine"], status: .available, sizeBytes: 162855936, infoUrl: "https://browse.library.kiwix.org/content/wikipedia_en_medicine_mini_2026-04"),
        KiwixResource(id: "kiwix-survival-outdoors", title: "The Outdoors Stack Exchange", category: .survival, description: "Complete Q&A archive from the outdoor skills community: wilderness survival, bushcraft, camping, hiking, navigation, and gear — real-world tested answers.", sizeLabel: "136 MB", downloadUrl: "https://download.kiwix.org/zim/stack_exchange/outdoors.stackexchange.com_en_all_2026-02.zim", language: "English", lastUpdated: "2026-02-01", tags: ["bushcraft", "camping", "hiking", "Q&A", "outdoor skills"], status: .available, sizeBytes: 142359552, infoUrl: "https://browse.library.kiwix.org/content/outdoors.stackexchange.com_en_all_2026-02"),
        KiwixResource(id: "kiwix-homestead-appropedia", title: "Appropedia — Appropriate Technology", category: .homesteading, description: "The sustainability and appropriate-technology wiki: solar power, water systems, food preservation, construction, sanitation, and small-scale farming for off-grid living.", sizeLabel: "555 MB", downloadUrl: "https://download.kiwix.org/zim/other/appropedia_en_all_maxi_2026-02.zim", language: "English", lastUpdated: "2026-02-01", tags: ["solar", "water systems", "food preservation", "construction", "farming"], status: .available, sizeBytes: 581642240, infoUrl: "https://browse.library.kiwix.org/content/appropedia_en_all_maxi_2026-02"),
        KiwixResource(id: "kiwix-ifixit", title: "iFixit Repair Guides", category: .engineering, description: "The complete iFixit archive — thousands of repair guides with photos for electronics, vehicles, appliances, and tools. Fix anything when replacement services are gone.", sizeLabel: "3.3 GB", downloadUrl: "https://download.kiwix.org/zim/ifixit/ifixit_en_all_2025-12.zim", language: "English", lastUpdated: "2025-12-01", tags: ["repair", "electronics", "vehicles", "appliances", "tools"], status: .available, sizeBytes: 3570696192, infoUrl: "https://browse.library.kiwix.org/content/ifixit_en_all_2025-12"),
        KiwixResource(id: "kiwix-engineering-computer", title: "Wikipedia — Computing & Electronics", category: .engineering, description: "All Wikipedia articles on computing, electronics, radio, and networking, without images. Covers circuit design, antennas, protocols, and hardware theory.", sizeLabel: "411 MB", downloadUrl: "https://download.kiwix.org/zim/wikipedia/wikipedia_en_computer_nopic_2026-06.zim", language: "English", lastUpdated: "2026-06-01", tags: ["electronics", "radio", "networking", "hardware", "protocols"], status: .available, sizeBytes: 431373312, infoUrl: "https://browse.library.kiwix.org/content/wikipedia_en_computer_nopic_2026-06"),
        KiwixResource(id: "kiwix-reference-physics-mini", title: "Wikipedia — Physics (Mini)", category: .reference, description: "Lead sections of all Wikipedia physics articles, no images. Energy, mechanics, electricity, and engineering fundamentals in a pocket-sized download.", sizeLabel: "54 MB", downloadUrl: "https://download.kiwix.org/zim/wikipedia/wikipedia_en_physics_mini_2026-07.zim", language: "English", lastUpdated: "2026-07-01", tags: ["physics", "energy", "electricity", "quick reference", "low bandwidth"], status: .available, sizeBytes: 56682496, infoUrl: "https://browse.library.kiwix.org/content/wikipedia_en_physics_mini_2026-07"),
        KiwixResource(id: "kiwix-reference-chemistry-mini", title: "Wikipedia — Chemistry (Mini)", category: .reference, description: "Lead sections of all Wikipedia chemistry articles, no images. Water treatment chemistry, fuel, disinfectants, and materials reference. Smallest pack in the catalog.", sizeLabel: "24 MB", downloadUrl: "https://download.kiwix.org/zim/wikipedia/wikipedia_en_chemistry_mini_2026-07.zim", language: "English", lastUpdated: "2026-07-01", tags: ["chemistry", "water treatment", "fuels", "quick reference", "low bandwidth"], status: .available, sizeBytes: 24776704, infoUrl: "https://browse.library.kiwix.org/content/wikipedia_en_chemistry_mini_2026-07"),
        KiwixResource(id: "kiwix-wikibooks", title: "Wikibooks Reference Library", category: .reference, description: "Open-content textbooks covering science, engineering, cooking, agriculture, and practical skills — without images. A broad knowledge base for long-term grid-down scenarios.", sizeLabel: "3.3 GB", downloadUrl: "https://download.kiwix.org/zim/wikibooks/wikibooks_en_all_nopic_2026-04.zim", language: "English", lastUpdated: "2026-04-01", tags: ["textbooks", "science", "engineering", "cooking", "math"], status: .available, sizeBytes: 3507894272, infoUrl: "https://browse.library.kiwix.org/content/wikibooks_en_all_nopic_2026-04"),
        KiwixResource(id: "kiwix-agriculture", title: "Wikispecies — Species Identification", category: .agriculture, description: "The global species directory: taxonomy and identification data for plants and animals. Useful for foraging, hunting, and avoiding toxic species.", sizeLabel: "1.4 GB", downloadUrl: "https://download.kiwix.org/zim/other/wikispecies_en_all_nopic_2026-07.zim", language: "English", lastUpdated: "2026-07-01", tags: ["species ID", "foraging", "plants", "animals", "taxonomy"], status: .available, sizeBytes: 1531480064, infoUrl: "https://browse.library.kiwix.org/content/wikispecies_en_all_nopic_2026-07"),
        KiwixResource(id: "kiwix-comms-ham-radio", title: "Amateur Radio Q&A", category: .comms, description: "Complete Q&A archive from the amateur radio community: antennas, propagation, equipment repair, and operating procedure — the knowledge base for getting a message through when networks are down.", sizeLabel: "72 MB", downloadUrl: "https://download.kiwix.org/zim/stack_exchange/ham.stackexchange.com_en_all_2026-08.zim", language: "English", lastUpdated: "2026-08-01", tags: ["ham radio", "antennas", "propagation", "shortwave", "Q&A"], status: .available, sizeBytes: 75931239, infoUrl: "https://browse.library.kiwix.org/content/ham.stackexchange.com_en_all_2026-08"),
        KiwixResource(id: "kiwix-education-ted-tech", title: "TED Tech Talks (Multilingual)", category: .other, description: "Technology and innovation talks in a dozen languages — engineering ideas, practical ingenuity, and futurism. Education and morale content for long stretches off-grid.", sizeLabel: "113 MB", downloadUrl: "https://download.kiwix.org/zim/ted/ted_mul_tech_2025-10.zim", language: "Multilingual", lastUpdated: "2025-10-01", tags: ["education", "talks", "technology", "innovation"], status: .available, sizeBytes: 118936923, infoUrl: "https://browse.library.kiwix.org/content/ted_mul_tech_2025-10"),
        KiwixResource(id: "kiwix-travel-wikivoyage", title: "Wikivoyage — World Travel Guide", category: .other, description: "The free worldwide travel guide, without images: cities, regions, border crossings, itineraries, and local knowledge for relocation, evacuation routes, or moving through unfamiliar territory.", sizeLabel: "223 MB", downloadUrl: "https://download.kiwix.org/zim/wikivoyage/wikivoyage_en_all_nopic_2026-06.zim", language: "English", lastUpdated: "2026-06-01", tags: ["travel", "regions", "border crossings", "relocation", "itineraries"], status: .available, sizeBytes: 233631995, infoUrl: "https://browse.library.kiwix.org/content/wikivoyage_en_all_nopic_2026-06"),
        KiwixResource(id: "kiwix-dictionary-wiktionary", title: "Simple English Dictionary", category: .reference, description: "Definitions, synonyms, and pronunciation for hundreds of thousands of English words in simplified English — the smallest complete dictionary in the catalog, no images.", sizeLabel: "25 MB", downloadUrl: "https://download.kiwix.org/zim/wiktionary/wiktionary_en-simple_all_nopic_2026-07.zim", language: "English", lastUpdated: "2026-07-01", tags: ["dictionary", "definitions", "language", "quick reference", "low bandwidth"], status: .available, sizeBytes: 26535079, infoUrl: "https://browse.library.kiwix.org/content/wiktionary_en-simple_all_nopic_2026-07"),
        KiwixResource(id: "kiwix-security-stackexchange", title: "Information Security Q&A", category: .security, description: "Complete Q&A archive from the information security community: OPSEC, encryption, secure communications, threat modeling, and privacy hardening — protecting your group when networks are untrusted.", sizeLabel: "419 MB", downloadUrl: "https://download.kiwix.org/zim/stack_exchange/security.stackexchange.com_en_all_2026-08.zim", language: "English", lastUpdated: "2026-08-01", tags: ["opsec", "encryption", "privacy", "threat modeling", "Q&A"], status: .available, sizeBytes: 439160380, infoUrl: "https://browse.library.kiwix.org/content/security.stackexchange.com_en_all_2026-08"),
    ]

    static let routeColors: [String] = [
        "#D4822A", "#4A90D9", "#CC3333", "#4CAF50", "#9B59B6", "#E8A04A", "#00BCD4", "#FF5722",
    ]

    static let weatherCodes: [Int: (label: String, icon: String)] = [
        0: ("Clear Sky", "sun.max.fill"),
        1: ("Mainly Clear", "sun.max.fill"),
        2: ("Partly Cloudy", "cloud.sun.fill"),
        3: ("Overcast", "cloud.fill"),
        45: ("Foggy", "cloud.fog.fill"),
        48: ("Rime Fog", "cloud.fog.fill"),
        51: ("Light Drizzle", "cloud.drizzle.fill"),
        53: ("Moderate Drizzle", "cloud.drizzle.fill"),
        55: ("Dense Drizzle", "cloud.drizzle.fill"),
        61: ("Slight Rain", "cloud.rain.fill"),
        63: ("Moderate Rain", "cloud.rain.fill"),
        65: ("Heavy Rain", "cloud.rain.fill"),
        66: ("Freezing Rain", "cloud.sleet.fill"),
        67: ("Heavy Freezing Rain", "cloud.sleet.fill"),
        71: ("Slight Snow", "snow"),
        73: ("Moderate Snow", "snow"),
        75: ("Heavy Snow", "snow"),
        77: ("Snow Grains", "snow"),
        80: ("Slight Showers", "cloud.rain.fill"),
        81: ("Moderate Showers", "cloud.rain.fill"),
        82: ("Violent Showers", "cloud.rain.fill"),
        85: ("Slight Snow Showers", "snow"),
        86: ("Heavy Snow Showers", "snow"),
        95: ("Thunderstorm", "cloud.bolt.fill"),
        96: ("Thunderstorm + Hail", "cloud.bolt.fill"),
        99: ("Thunderstorm + Heavy Hail", "cloud.bolt.fill"),
    ]

    /// Generates a starter set of tactical POIs around the user's actual
    /// location for first-launch seeding instead of the St. Louis demo data.
    /// Offsets are deterministic (~1° ≈ 111 km; values here are 0.2-1 km).
    /// Infrastructure POIs are not generated — they require real place data
    /// the app cannot fabricate.
    static func generateLocalPois(center: Coordinates) -> [POI] {
        func at(_ dLat: Double, _ dLng: Double) -> Coordinates {
            Coordinates(latitude: center.latitude + dLat, longitude: center.longitude + dLng)
        }
        return [
            POI(id: "local-rally-1", name: "Rally Point Alpha", category: .rallyPoint, coordinates: at(0.004, 0.003), notes: "Primary meetup spot near home base. Edit this POI and set the real location your group agreed on.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-rally-2", name: "Rally Point Bravo", category: .rallyPoint, coordinates: at(-0.005, 0.004), notes: "Alternate meetup — different direction than Alpha. Pick a covered, easy-to-find spot.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-rally-3", name: "Rally Point Charlie", category: .rallyPoint, coordinates: at(0.003, -0.006), notes: "Emergency fallback — low-traffic and concealed from main roads.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-water-1", name: "Water Source — Surveyed", category: .water, coordinates: at(-0.004, -0.003), notes: "Nearest known surface water or well. Always filter and purify. Edit with the real location and access notes.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-shelter-1", name: "Shelter Option", category: .shelter, coordinates: at(0.006, -0.002), notes: "Nearby building with potential for sheltering the group — note capacity, water access, and structural quality.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-cache-1", name: "Cache — Primary", category: .supplyCache, coordinates: at(-0.002, -0.005), notes: "Pre-positioned supply cache. List contents and rotation date in these notes — GPS coordinates only, no surface markers.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-comms-1", name: "Comms Point — High Ground", category: .comms, coordinates: at(0.008, 0.006), notes: "Best local elevation for radio line-of-sight. Deploy the portable mast here for extended range.", createdAt: "2024-01-01T00:00:00.000Z"),
            POI(id: "local-hazard-1", name: "Local Hazard Zone", category: .hazard, coordinates: at(-0.008, -0.007), notes: "Flood-prone, industrial, or high-crime area to avoid during alerts. Describe the specific risk.", createdAt: "2024-01-01T00:00:00.000Z"),
        ]
    }

    /// Generates starter routes around the user's location to accompany
    /// generateLocalPois — a bug-out heading and a local recon loop.
    static func generateLocalRoutes(center: Coordinates) -> [Route] {
        func at(_ dLat: Double, _ dLng: Double) -> Coordinates {
            Coordinates(latitude: center.latitude + dLat, longitude: center.longitude + dLng)
        }
        return [
            Route(id: "local-route-evac-1", name: "Bug-Out Route (Primary)", color: "#D4822A", waypoints: [
                at(0.004, 0.003),
                at(0.02, 0.02),
                at(0.05, 0.045),
                at(0.09, 0.08),
            ], notes: "Primary evacuation heading away from the city center. Edit waypoints to follow real roads and avoid choke points.", createdAt: "2024-01-01T00:00:00.000Z"),
            Route(id: "local-route-recon-1", name: "Local Recon Loop", color: "#4CAF50", waypoints: [
                at(0.004, 0.003),
                at(0.008, 0.006),
                at(0.006, -0.002),
                at(0.0, 0.0),
                at(-0.004, -0.003),
                at(0.004, 0.003),
            ], notes: "Loop past the comms point, shelter, home base, and water source. Adjust to your actual locations.", createdAt: "2024-01-01T00:00:00.000Z"),
        ]
    }
}
