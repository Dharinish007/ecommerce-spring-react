package com.ecommerce.project.config;

import com.ecommerce.project.model.*;
import com.ecommerce.project.repositories.CategoryRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Initializing Angadi system data and development seed catalog...");
        initRoles();
        initDefaultUsers();
        initCatalogData();
        logger.info("Angadi initialization completed successfully.");
    }

    private void initRoles() {
        if (roleRepository.findByRoleName(AppRole.ROLE_USER).isEmpty()) {
            roleRepository.save(new Role(AppRole.ROLE_USER));
        }
        if (roleRepository.findByRoleName(AppRole.ROLE_ADMIN).isEmpty()) {
            roleRepository.save(new Role(AppRole.ROLE_ADMIN));
        }
        if (roleRepository.findByRoleName(AppRole.ROLE_SELLER).isEmpty()) {
            roleRepository.save(new Role(AppRole.ROLE_SELLER));
        }
    }

    private void initDefaultUsers() {
        Role userRole = roleRepository.findByRoleName(AppRole.ROLE_USER).orElseThrow();
        Role adminRole = roleRepository.findByRoleName(AppRole.ROLE_ADMIN).orElseThrow();
        Role sellerRole = roleRepository.findByRoleName(AppRole.ROLE_SELLER).orElseThrow();

        // 1. Default Admin: admin / admin123
        if (!userRepository.existsByUserName("admin")) {
            User admin = new User("admin", "admin@angadi.com", passwordEncoder.encode("admin123"));
            admin.setRoles(Set.of(adminRole, userRole));
            userRepository.save(admin);
            logger.info("Created default administrator: admin / admin123");
        }

        // 2. Default Seller: seller / seller123
        if (!userRepository.existsByUserName("seller")) {
            User seller = new User("seller", "seller@angadi.com", passwordEncoder.encode("seller123"));
            seller.setRoles(Set.of(sellerRole, userRole));
            userRepository.save(seller);
            logger.info("Created default seller: seller / seller123");
        }

        // 3. Default Customer: john_doe / user123
        if (!userRepository.existsByUserName("john_doe")) {
            User user = new User("john_doe", "john.doe@example.com", passwordEncoder.encode("user123"));
            user.setRoles(Set.of(userRole));
            userRepository.save(user);
            logger.info("Created default customer: john_doe / user123");
        }
    }

    private void initCatalogData() {
        if (categoryRepository.existsByCategoryNameIgnoreCase("Mobiles & Tablets")) {
            logger.info("Angadi catalog already seeded. Skipping development seed.");
            return;
        }

        logger.info("Seeding 12 Angadi categories and realistic marketplace products...");

        User seller = userRepository.findByUserName("seller").orElse(null);

        // 1. Mobiles & Tablets
        Category mobiles = saveCategory("Mobiles & Tablets");
        createProduct(mobiles, seller, "Apple iPhone 15 Pro Max (256GB - Natural Titanium)",
                "Titanium design, A17 Pro chip, 48MP main camera with 5x optical telephoto lens, and USB-C with USB 3 speeds.",
                new BigDecimal("159900.00"), new BigDecimal("8.00"), 45, "default.png");
        createProduct(mobiles, seller, "Samsung Galaxy S24 Ultra 5G (512GB, Titanium Gray)",
                "Snapdragon 8 Gen 3, 200MP camera, AI live translation, built-in S Pen, and Gorilla Armor anti-reflective display.",
                new BigDecimal("139999.00"), new BigDecimal("10.00"), 35, "default.png");
        createProduct(mobiles, seller, "Google Pixel 8 Pro (128GB, Obsidian)",
                "Google Tensor G3 processor, pro-level camera controls, temperature sensor, and 7 years of OS updates.",
                new BigDecimal("106999.00"), new BigDecimal("15.00"), 20, "default.png");
        createProduct(mobiles, seller, "OnePlus 12 (16GB RAM, 512GB Storage - Flowy Emerald)",
                "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera system, 5400 mAh battery with 100W SUPERVOOC charging.",
                new BigDecimal("69999.00"), new BigDecimal("5.00"), 50, "default.png");
        createProduct(mobiles, seller, "Apple iPad Air 11-inch M2 (128GB, Space Gray)",
                "Supercharged by Apple M2 chip, 11-inch Liquid Retina display, landscape 12MP front camera, Wi-Fi 6E.",
                new BigDecimal("59900.00"), new BigDecimal("5.00"), 25, "default.png");
        createProduct(mobiles, seller, "Redmi Note 13 Pro+ 5G (Fusion Black, 256GB)",
                "200MP OIS camera, 3D curved 120Hz AMOLED screen, 120W HyperCharge, IP68 water & dust resistance.",
                new BigDecimal("31999.00"), new BigDecimal("12.00"), 60, "default.png");

        // 2. Laptops & Computers
        Category laptops = saveCategory("Laptops & Computers");
        createProduct(laptops, seller, "Apple MacBook Air 15-inch M3 (16GB Unified Memory, 512GB SSD)",
                "Liquid Retina display with 500 nits brightness, 18-hour battery life, 1080p FaceTime HD camera, MagSafe 3 charging.",
                new BigDecimal("154900.00"), new BigDecimal("7.00"), 18, "default.png");
        createProduct(laptops, seller, "Dell XPS 15 9530 OLED Touch (Intel Core i7-13700H, RTX 4060, 32GB RAM, 1TB SSD)",
                "3.5K OLED touchscreen with 100% DCI-P3 color gamut, CNC machined aluminum chassis, quad-speaker system.",
                new BigDecimal("219990.00"), new BigDecimal("12.00"), 8, "default.png");
        createProduct(laptops, seller, "Lenovo ThinkPad X1 Carbon Gen 11 (Intel Core i7, 16GB RAM, 1TB SSD)",
                "Ultralight carbon-fiber business laptop, spill-resistant legendary keyboard, Rapid Charge, military-spec tested.",
                new BigDecimal("168500.00"), new BigDecimal("10.00"), 15, "default.png");
        createProduct(laptops, seller, "ASUS ROG Zephyrus G14 Gaming Laptop (AMD Ryzen 9, RTX 4070, 16GB, 1TB)",
                "ROG Nebula HDR 165Hz display, AniMe Matrix lid, vapor chamber cooling, quad speakers with Dolby Atmos.",
                new BigDecimal("184990.00"), new BigDecimal("8.00"), 6, "default.png");
        createProduct(laptops, seller, "Dell UltraSharp 27-inch 4K USB-C Hub Monitor (U2723QE)",
                "IPS Black technology with 2000:1 contrast ratio, 90W USB-C power delivery, RJ45 Ethernet, built-in KVM switch.",
                new BigDecimal("58900.00"), new BigDecimal("15.00"), 22, "default.png");
        createProduct(laptops, seller, "Logitech MX Master 3S Wireless Performance Mouse",
                "Quiet Click switches, 8K DPI any-surface tracking sensor, MagSpeed electromagnetic scrolling wheel.",
                new BigDecimal("9995.00"), new BigDecimal("10.00"), 80, "default.png");

        // 3. Audio & Headphones
        Category audio = saveCategory("Audio & Headphones");
        createProduct(audio, seller, "Sony WH-1000XM5 Wireless Industry-Leading Noise Canceling Headphones",
                "Dual processors with 8 microphones, Auto NC Optimizer, 30-hour battery life, speak-to-chat technology.",
                new BigDecimal("29990.00"), new BigDecimal("13.00"), 40, "default.png");
        createProduct(audio, seller, "Apple AirPods Pro (2nd Generation with USB-C MagSafe Case)",
                "H2 chip, active noise cancellation with transparency mode, personalized spatial audio with dynamic head tracking.",
                new BigDecimal("24900.00"), new BigDecimal("6.00"), 50, "default.png");
        createProduct(audio, seller, "Bose QuietComfort Ultra Headphones (Black)",
                "World-class active noise cancelling, Bose Immersive Audio, CustomTune audio calibration, 24-hour battery.",
                new BigDecimal("35900.00"), new BigDecimal("8.00"), 12, "default.png");
        createProduct(audio, seller, "JBL Flip 6 Portable Waterproof Bluetooth Speaker",
                "2-way speaker system, dual passive radiators, IP67 waterproof and dustproof, 12 hours of playtime with PartyBoost.",
                new BigDecimal("11999.00"), new BigDecimal("25.00"), 65, "default.png");
        createProduct(audio, seller, "Marshall Stanmore III Bluetooth Home Speaker",
                "Signature Marshall rock-and-roll sound, wider stereo soundstage, dynamic loudness, brass-accented control knobs.",
                new BigDecimal("37999.00"), new BigDecimal("5.00"), 10, "default.png");
        createProduct(audio, seller, "Sennheiser Momentum 4 Wireless Audiophile Headphones",
                "60-hour ultra-long battery life, 42mm transducer system, customizable sound with built-in EQ presets.",
                new BigDecimal("34990.00"), new BigDecimal("20.00"), 14, "default.png");

        // 4. Wearables & Smartwatches
        Category wearables = saveCategory("Wearables & Smartwatches");
        createProduct(wearables, seller, "Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium Case)",
                "3000 nits display, dual-frequency precision GPS, 36-hour normal battery life, depth gauge for scuba diving.",
                new BigDecimal("89900.00"), new BigDecimal("5.00"), 20, "default.png");
        createProduct(wearables, seller, "Samsung Galaxy Watch 6 Classic (47mm, Bluetooth)",
                "Rotating physical bezel, sapphire crystal glass, sleep coaching, body composition analysis (BIA).",
                new BigDecimal("36999.00"), new BigDecimal("15.00"), 25, "default.png");
        createProduct(wearables, seller, "Garmin Fenix 7X Pro Solar Multisport GPS Smartwatch",
                "Solar charging Power Sapphire lens, built-in LED flashlight, multi-band GNSS, endurance and hill scores.",
                new BigDecimal("105990.00"), new BigDecimal("10.00"), 5, "default.png");
        createProduct(wearables, seller, "Fitbit Charge 6 Fitness Tracker with Google Apps",
                "Heart rate on gym equipment, built-in GPS, 40+ exercise modes, ECG app, 7-day battery life.",
                new BigDecimal("14999.00"), new BigDecimal("20.00"), 40, "default.png");
        createProduct(wearables, seller, "Noise ColorFit Pro 5 Max Smart Watch",
                "1.96-inch AMOLED display, Bluetooth calling, rapid health monitoring, 100+ sports modes, 7-day battery.",
                new BigDecimal("4999.00"), new BigDecimal("40.00"), 100, "default.png");

        // 5. Cameras & Photography
        Category cameras = saveCategory("Cameras & Photography");
        createProduct(cameras, seller, "Sony Alpha 7 IV Full-Frame Mirrorless Camera (Body Only)",
                "33MP Exmor R CMOS sensor, 4K 60p 10-bit video, real-time Eye AF for human, animal and bird, 5-axis stabilization.",
                new BigDecimal("214990.00"), new BigDecimal("10.00"), 8, "default.png");
        createProduct(cameras, seller, "Fujifilm X-T5 Mirrorless Digital Camera with 16-80mm Lens",
                "40.2MP X-Trans CMOS 5 HR sensor, 5-axis in-body image stabilization, classic retro dials, 6.2K 30p movie recording.",
                new BigDecimal("199999.00"), new BigDecimal("5.00"), 4, "default.png");
        createProduct(cameras, seller, "Canon EOS R6 Mark II Mirrorless Camera (RF 24-105mm Lens)",
                "24.2MP full-frame CMOS sensor, 40 fps electronic shutter, 6K oversampled 4K 60p, dual card slots.",
                new BigDecimal("249995.00"), new BigDecimal("8.00"), 6, "default.png");
        createProduct(cameras, seller, "GoPro HERO12 Black Waterproof Action Camera",
                "5.3K 60 video, HDR video & photo, HyperSmooth 6.0 stabilization, rugged waterproof up to 33ft, 2x longer runtime.",
                new BigDecimal("39990.00"), new BigDecimal("12.00"), 30, "default.png");
        createProduct(cameras, seller, "DJI Mini 4 Pro Drone with RC 2 Controller",
                "Omnidirectional obstacle sensing, 4K 60fps HDR video, 34-min flight time, 20km FHD video transmission.",
                new BigDecimal("108990.00"), new BigDecimal("5.00"), 7, "default.png");

        // 6. Televisions & Home Entertainment
        Category tvs = saveCategory("Televisions & Home Entertainment");
        createProduct(tvs, seller, "LG 65-inch OLED evo C3 4K Smart TV",
                "Self-lit OLED pixels with infinite contrast, α9 AI Processor Gen6, 120Hz refresh rate, Dolby Vision & Atmos, webOS 23.",
                new BigDecimal("189990.00"), new BigDecimal("18.00"), 12, "default.png");
        createProduct(tvs, seller, "Sony Bravia 55-inch 4K Ultra HD Google TV (KD-55X74L)",
                "X1 4K Processor, Live Color technology, 20W open baffle speaker with Dolby Audio, Google TV smart interface.",
                new BigDecimal("62900.00"), new BigDecimal("15.00"), 20, "default.png");
        createProduct(tvs, seller, "Samsung 55-inch The Frame QLED 4K Art Mode TV",
                "Matte display, Art Mode with Art Store, Quantum HDR, customizable bezel, slim fit wall mount included.",
                new BigDecimal("84990.00"), new BigDecimal("10.00"), 15, "default.png");
        createProduct(tvs, seller, "Sony HT-A7000 7.1.2ch Dolby Atmos Soundbar",
                "Built-in subwoofers, 360 Spatial Sound Mapping, Sound Field Optimization, 8K and 4K 120Hz passthrough.",
                new BigDecimal("109990.00"), new BigDecimal("12.00"), 8, "default.png");
        createProduct(tvs, seller, "Apple TV 4K Wi-Fi with 64GB Storage (3rd Generation)",
                "A15 Bionic chip, Dolby Vision, HDR10+, Dolby Atmos, Siri Remote with touch-enabled clickpad.",
                new BigDecimal("14900.00"), new BigDecimal("0.00"), 35, "default.png");

        // 7. Home & Kitchen Appliances
        Category appliances = saveCategory("Home & Kitchen Appliances");
        createProduct(appliances, seller, "Dyson V15 Detect Cordless Vacuum Cleaner",
                "Laser reveals microscopic dust, acoustic piezo sensor measures dust particles, powerful Dyson Hyperdymium motor.",
                new BigDecimal("62900.00"), new BigDecimal("10.00"), 15, "default.png");
        createProduct(appliances, seller, "Philips Digital Airfryer XXL HD9650/99 (1.4kg Capacity)",
                "Twin TurboStar technology removes fat from food, digital display with 5 preset programs, QuickClean basket.",
                new BigDecimal("19995.00"), new BigDecimal("25.00"), 30, "default.png");
        createProduct(appliances, seller, "Instant Pot Duo Plus 9-in-1 Electric Pressure Cooker (6 Quart)",
                "Pressure cook, slow cook, sauté, steam, sous vide, sterilize, yogurt maker, stainless steel inner pot.",
                new BigDecimal("12999.00"), new BigDecimal("20.00"), 28, "default.png");
        createProduct(appliances, seller, "De'Longhi Magnifica S Automatic Espresso Coffee Machine",
                "Integrated bean grinder, traditional milk frother, customized coffee aroma and quantity, easy cleanup.",
                new BigDecimal("54990.00"), new BigDecimal("15.00"), 10, "default.png");
        createProduct(appliances, seller, "Mi Smart Air Purifier 4 with True HEPA Filter",
                "High-efficiency particulate air filter, 360-degree all-round air intake, OLED touch display, app control.",
                new BigDecimal("14999.00"), new BigDecimal("18.00"), 40, "default.png");
        createProduct(appliances, seller, "Prestige Iris 750 Watt Mixer Grinder with 4 Jars",
                "Heavy-duty 750W motor, 3 stainless steel jars, 1 juicer jar with blade, overload protection.",
                new BigDecimal("4495.00"), new BigDecimal("35.00"), 50, "default.png");

        // 8. Men's Fashion
        Category mensFashion = saveCategory("Men's Fashion");
        createProduct(mensFashion, seller, "Levi's Men's 511 Slim Fit Stretch Jeans (Dark Stonewash)",
                "Modern slim-cut jeans with room to move, premium cotton with stretch elastane, zip fly with button closure.",
                new BigDecimal("3499.00"), new BigDecimal("25.00"), 60, "default.png");
        createProduct(mensFashion, seller, "Tommy Hilfiger Men's Classic Solid Oxford Shirt",
                "100% pure organic cotton, button-down collar, embroidered signature flag logo on chest, regular fit.",
                new BigDecimal("4999.00"), new BigDecimal("20.00"), 45, "default.png");
        createProduct(mensFashion, seller, "Nike Sportswear Club Fleece Pullover Hoodie",
                "Brushed-back fleece for ultra-soft warmth, classic embroidered Nike Futura logo, kangaroo pocket.",
                new BigDecimal("3795.00"), new BigDecimal("10.00"), 50, "default.png");
        createProduct(mensFashion, seller, "Clarks Men's Tilden Walk Leather Derby Shoes",
                "Full-grain black leather exterior, OrthoLite footbed with Cushion Soft padding, flexible TPR outsole.",
                new BigDecimal("6999.00"), new BigDecimal("30.00"), 25, "default.png");
        createProduct(mensFashion, seller, "Fossil Men's Grant Chronograph Brown Leather Watch",
                "Classic Roman numeral markers, stainless steel 44mm case, interchangeable genuine leather strap.",
                new BigDecimal("12495.00"), new BigDecimal("35.00"), 20, "default.png");

        // 9. Women's Fashion
        Category womensFashion = saveCategory("Women's Fashion");
        createProduct(womensFashion, seller, "BIBA Women's Printed Anarkali Kurta with Dupatta Set",
                "Pure cotton fabric with ethnic floral prints, round neck with three-quarter sleeves, flared hemline.",
                new BigDecimal("3999.00"), new BigDecimal("30.00"), 40, "default.png");
        createProduct(womensFashion, seller, "Zara Women's Oversized Double-Breasted Trench Coat",
                "Water-repellent fabric, lapel collar, long sleeves with adjustable tabs, matching belt with buckle.",
                new BigDecimal("7990.00"), new BigDecimal("10.00"), 18, "default.png");
        createProduct(womensFashion, seller, "Michael Kors Jet Set Large East West Saffiano Leather Tote",
                "Saffiano textured leather, gold-tone hardware, top zip closure, multiple interior slip and zip pockets.",
                new BigDecimal("22500.00"), new BigDecimal("25.00"), 12, "default.png");
        createProduct(womensFashion, seller, "Nike Women's Air Max 270 Sneakers (White/Black)",
                "Large Max Air 270 heel unit for responsive cushioning, breathable mesh upper, stretchy inner sleeve.",
                new BigDecimal("13995.00"), new BigDecimal("15.00"), 30, "default.png");
        createProduct(womensFashion, seller, "Ray-Ban Aviator Classic Polarized Sunglasses",
                "Iconic teardrop metal frame, G-15 green polarized crystal lenses with 100% UV protection.",
                new BigDecimal("10890.00"), new BigDecimal("10.00"), 35, "default.png");

        // 10. Sports, Fitness & Outdoors
        Category sports = saveCategory("Sports, Fitness & Outdoors");
        createProduct(sports, seller, "Nike Air Zoom Pegasus 40 Men's Road Running Shoes",
                "Dual Zoom Air units for responsive bounce, breathable engineered mesh, tuned single-layer mesh upper.",
                new BigDecimal("11895.00"), new BigDecimal("20.00"), 45, "default.png");
        createProduct(sports, seller, "Yonex Nanoray Light 18i Graphite Badminton Racquet (77g)",
                "Full graphite frame, isometric head shape, aerodynamic frame, strung with full cover included.",
                new BigDecimal("2490.00"), new BigDecimal("25.00"), 70, "default.png");
        createProduct(sports, seller, "Kobo Adjustable Cast Iron Dumbbell Set (20kg with Case)",
                "Heavy-duty cast iron plates, threaded chrome handles, spin-lock collars, portable molded storage case.",
                new BigDecimal("4999.00"), new BigDecimal("25.00"), 25, "default.png");
        createProduct(sports, seller, "Manduka PRO Yoga Mat 6mm (Black Sage)",
                "High-density closed-cell PVC cushioning, non-toxic emissions-free manufacturing, lifetime guarantee.",
                new BigDecimal("11500.00"), new BigDecimal("5.00"), 15, "default.png");
        createProduct(sports, seller, "Coleman Sundome 4-Person Camping Tent",
                "WeatherTec system with patented welded floors and inverted seams, large windows and ground vent, snag-free pole sleeves.",
                new BigDecimal("9999.00"), new BigDecimal("20.00"), 18, "default.png");
        createProduct(sports, seller, "SS Master 500 English Willow Cricket Bat (Short Handle)",
                "Grade 3 air-dried English willow, concave thick edges, rounded toe, 9-piece cane handle with rubber grip.",
                new BigDecimal("8499.00"), new BigDecimal("15.00"), 10, "default.png");

        // 11. Books & Stationery
        Category books = saveCategory("Books & Stationery");
        createProduct(books, seller, "Atomic Habits: An Easy & Proven Way to Build Good Habits by James Clear",
                "The definitive guide to breaking bad behaviors and adopting good habits through 1% incremental daily improvements.",
                new BigDecimal("799.00"), new BigDecimal("35.00"), 120, "default.png");
        createProduct(books, seller, "The Psychology of Money by Morgan Housel",
                "Timeless lessons on wealth, greed, and happiness exploring how people think about money in behavioral terms.",
                new BigDecimal("499.00"), new BigDecimal("30.00"), 150, "default.png");
        createProduct(books, seller, "Clean Architecture by Robert C. Martin (Uncle Bob)",
                "A Craftsman's Guide to Software Structure and Design, explaining universal architectural principles.",
                new BigDecimal("3499.00"), new BigDecimal("15.00"), 40, "default.png");
        createProduct(books, seller, "Designing Data-Intensive Applications by Martin Kleppmann",
                "The big ideas behind reliable, scalable, and maintainable data storage systems and distributed architectures.",
                new BigDecimal("3899.00"), new BigDecimal("10.00"), 30, "default.png");
        createProduct(books, seller, "Kindle Paperwhite (16 GB) - 6.8-inch display with Adjustable Warm Light",
                "300 ppi glare-free display, 10 weeks of battery life, 20% faster page turns, waterproof reading (IPX8).",
                new BigDecimal("14999.00"), new BigDecimal("7.00"), 35, "default.png");
        createProduct(books, seller, "Moleskine Classic Hard Cover Notebook (Large, Ruled, Sapphire Blue)",
                "Thread-bound with rounded corners, acid-free ivory paper, bookmark ribbon, elastic closure band, expandable pocket.",
                new BigDecimal("1899.00"), new BigDecimal("10.00"), 60, "default.png");
        createProduct(books, seller, "Lamy Safari Fountain Pen (Charcoal Black, Fine Nib)",
                "Timeless ergonomic design, sturdy ABS plastic body, self-sprung chrome metal clip, steel polished nib.",
                new BigDecimal("2990.00"), new BigDecimal("15.00"), 45, "default.png");

        // 12. Beauty & Personal Care
        Category beauty = saveCategory("Beauty & Personal Care");
        createProduct(beauty, seller, "Philips Series 7000 Wet & Dry Electric Shaver (S7786/50)",
                "SkinGlide coating reduces friction, SteelPrecision blades cut up to 90,000 actions per min, 360-D flexing heads.",
                new BigDecimal("9995.00"), new BigDecimal("20.00"), 30, "default.png");
        createProduct(beauty, seller, "Oral-B iO Series 9 Electric Toothbrush (Black Onyx)",
                "Revolutionary magnetic iO technology, 3D teeth tracking with AI, interactive color display, smart pressure sensor.",
                new BigDecimal("21999.00"), new BigDecimal("15.00"), 12, "default.png");
        createProduct(beauty, seller, "The Ordinary Niacinamide 10% + Zinc 1% High-Strength Serum (60ml)",
                "Vitamin and mineral blemish formula designed to reduce the appearance of skin blemishes and congestion.",
                new BigDecimal("1100.00"), new BigDecimal("0.00"), 80, "default.png");
        createProduct(beauty, seller, "Forest Essentials Soundarya Radiance Cream with 24K Gold & SPF 25",
                "Ayurvedic luxury face cream infused with 24 Karat Gold Bhasma, pure cow's ghee, and precious herb extracts.",
                new BigDecimal("6200.00"), new BigDecimal("5.00"), 20, "default.png");
        createProduct(beauty, seller, "Dior Sauvage Eau De Parfum for Men (100ml)",
                "Exudes notes of radiant Calabrian bergamot, sensual Papua New Guinean vanilla absolute, and smoky ambery facets.",
                new BigDecimal("13500.00"), new BigDecimal("0.00"), 25, "default.png");
        createProduct(beauty, seller, "Neutrogena Hydro Boost Water Gel Face Moisturizer (50g)",
                "Formulated with hyaluronic acid, provides 72-hour hydration, oil-free, non-comedogenic, dermatologist tested.",
                new BigDecimal("950.00"), new BigDecimal("20.00"), 90, "default.png");

        // Strategic Out-Of-Stock & Low-Stock Specialty Products (to ensure diverse catalog states)
        Category gaming = saveCategory("Gaming & Consoles");
        createProduct(gaming, seller, "Sony PlayStation 5 Pro Console (2TB SSD Edition)",
                "Advanced ray tracing, PlayStation Spectral Super Resolution (PSSR), 4K gaming at 60fps/120fps.",
                new BigDecimal("69990.00"), new BigDecimal("0.00"), 0, "default.png"); // Out of Stock!
        createProduct(gaming, seller, "Nintendo Switch OLED Model (White Joy-Con)",
                "7-inch OLED screen, wide adjustable stand, wired LAN port, 64 GB internal storage, enhanced audio.",
                new BigDecimal("34999.00"), new BigDecimal("5.00"), 2, "default.png"); // Low Stock!

        logger.info("Successfully populated Angadi marketplace catalog with realistic seed data.");
    }

    private Category saveCategory(String name) {
        Category cat = new Category();
        cat.setCategoryName(name);
        return categoryRepository.save(cat);
    }

    private void createProduct(Category category, User seller, String name, String description,
                               BigDecimal price, BigDecimal discountPercent, int quantity, String image) {
        Product p = new Product();
        p.setProductName(name);
        p.setDescription(description);
        p.setPrice(price);
        p.setDiscount(discountPercent != null ? discountPercent : BigDecimal.ZERO);
        p.setSpecialPrice(calculateSpecialPrice(price, discountPercent));
        p.setQuantity(quantity);
        p.setImage(image != null ? image : "default.png");
        p.setCategory(category);
        p.setUser(seller);
        productRepository.save(p);
    }

    private BigDecimal calculateSpecialPrice(BigDecimal price, BigDecimal discount) {
        if (price == null) {
            return BigDecimal.ZERO;
        }
        if (discount == null || discount.compareTo(BigDecimal.ZERO) <= 0) {
            return price;
        }
        BigDecimal fraction = discount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal discountAmount = price.multiply(fraction).setScale(2, RoundingMode.HALF_UP);
        return price.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
    }
}
