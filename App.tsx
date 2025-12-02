import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { Video, AVPlaybackSource, ResizeMode } from "expo-av";

const CRAFTTECH_LOGO = require("./assets/crafttech-logo.png");

/* -----------------------------------------------------
   RESPONSIVE UTILITIES
----------------------------------------------------- */
const useDriver = Platform.OS !== "web";

const MIN_WIDTH = 320;
const MAX_WIDTH = 1280;
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

// Responsive scaler with fixed min/max boundaries
export const scaleFont = (size: number, width: number): number => {
  const baseWidth = 375;
  const scaleFactor = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH) / baseWidth;
  
  if (width < 380) return Math.max(size * 0.85, 10);
  if (width < 480) return size * 0.95;
  if (width < MOBILE_BREAKPOINT) return size;
  if (width < TABLET_BREAKPOINT) return size * 1.1;
  return size * 1.2;
};

// Responsive value generator
const responsiveValue = <T,>(
  mobile: T,
  tablet: T,
  desktop: T,
  width: number
): T => {
  if (width < MOBILE_BREAKPOINT) return mobile;
  if (width < TABLET_BREAKPOINT) return tablet;
  return desktop;
};

/* -----------------------------------------------------
   TYPES
----------------------------------------------------- */
type SectionKey =
  | "hero"
  | "services"
  | "process"
  | "work"
  | "testimonials"
  | "contact";

type PortfolioCategory = "all" | "web" | "mobile" | "ecommerce";

interface PortfolioItem {
  id: number;
  title: string;
  type: string;
  category: PortfolioCategory;
  description: string;
  metrics: string[];
  img: string;
}

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  source: AVPlaybackSource;
}

/* -----------------------------------------------------
   PREMIUM COLOR SCHEME
----------------------------------------------------- */
const COLORS = {
  bg: "#0A0F0D",         // Deep charcoal
  bgSoft: "#111715",     // Lifted dark
  card: "#1A211E",       // Rich dark
  cardSoft: "#222A26",   // Elevated card
  border: "#2D3632",
  neon: "#B6FF33",       // Lime green (matches reference)
  neonSoft: "#A2E52E",   // Softer lime
  accent: "#6366F1",     // Indigo accent
  text: "#F8FAF6",       // Clean white
  textMuted: "#94A39A",  // Muted sage
  subtle: "#6B7A70",     // Medium muted
};

/* -----------------------------------------------------
   PREMIUM HERO SLIDES
----------------------------------------------------- */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "crafting-premium",
    title: "We craft software that feels premium\nand performs under pressure.",
    subtitle: "From concept to launch, CraftTech partners with US businesses to design and build modern digital products.",
    source: require("./assets/Herovideo1.mp4"),
  },
  {
    id: "future-architecture",
    title: "Type-safe, AI-ready architectures\nbuilt for the next decade.",
    subtitle: "We use modern TypeScript, cloud, and data practices to future-proof your platforms.",
    source: require("./assets/Hero2.mp4"),
  },
  {
    id: "product-squad",
    title: "Your product squad — strategy, design,\nand engineering in one team.",
    subtitle: "A distributed studio from Pakistan building for North American founders, product leaders, and CTOs.",
    source: require("./assets/Hero3.mp4"),
  },
];

/* -----------------------------------------------------
   PREMIUM PORTFOLIO ITEMS
----------------------------------------------------- */
const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    title: "Fintech SaaS Dashboard",
    type: "Web App",
    category: "web",
    description: "Analytics-heavy admin experience with secure multi-tenant access and real-time KPIs.",
    metrics: ["+38% retention", "SOC2-ready", "Enterprise grade"],
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
  },
  {
    id: 2,
    title: "Telehealth Mobile Platform",
    type: "Mobile App",
    category: "mobile",
    description: "Virtual care, scheduling, and secure messaging for a US-based healthcare startup.",
    metrics: ["iOS & Android", "50k+ sessions", "HIPAA compliant"],
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    title: "Headless Commerce Experience",
    type: "E-Commerce",
    category: "ecommerce",
    description: "Conversion-optimized storefront with a custom product configurator and fast checkout.",
    metrics: ["3.9x ROI", "<1s page loads", "PWA ready"],
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
  },
];

/* -----------------------------------------------------
   PREMIUM TESTIMONIALS
----------------------------------------------------- */
const TESTIMONIALS = [
  {
    id: 1,
    quote: "CraftTech helped us ship a product our customers actually love to use. Their attention to detail in both design and engineering is exceptional.",
    name: "Jordan Miles",
    role: "VP Product, Fintech Startup",
    company: "ScaleFin",
  },
  {
    id: 2,
    quote: "They understand both UX and engineering at a deep level. The collaboration felt like having an internal product squad that just gets it.",
    name: "Emily Carter",
    role: "Founder & CEO",
    company: "HealthTech Solutions",
  },
  {
    id: 3,
    quote: "Clear communication, exceptional quality, and they handled complex requirements without drama. Would partner with them again in a heartbeat.",
    name: "Daniel Ortiz",
    role: "CTO",
    company: "Modern Retail Co",
  },
];

/* -----------------------------------------------------
   GRADIENT VIEW COMPONENT
----------------------------------------------------- */
const GradientView: React.FC<{
  colors: string[];
  style?: any;
  children?: React.ReactNode;
}> = ({ colors, style, children }) => {
  if (Platform.OS === 'web') {
    return (
      <View 
        style={[
          style,
          {
            background: `linear-gradient(135deg, ${colors.join(', ')})`,
          }
        ]}
      >
        {children}
      </View>
    );
  }
  
  return (
    <View 
      style={[
        style,
        { backgroundColor: colors[0] }
      ]}
    >
      {children}
    </View>
  );
};

// Enhanced animated components
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/* -----------------------------------------------------
   SCROLL ANIMATION HOOK
----------------------------------------------------- */
const useScrollAnimation = (delay: number = 0, scrollY?: Animated.Value) => {
  const [isVisible, setIsVisible] = useState(false);
  const [layoutY, setLayoutY] = useState<number | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View | null>(null);

  const animateIn = () => {
    if (isVisible) return;
    setIsVisible(true);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useDriver,
    }).start();
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setLayoutY(e.nativeEvent.layout.y);
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      if (isVisible) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateIn();
              observer.disconnect();
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -100px 0px",
        }
      );

      if (viewRef.current) {
        observer.observe(viewRef.current as any);
      }

      return () => observer.disconnect();
    }

    if (!scrollY) {
      const t = setTimeout(() => {
        animateIn();
      }, 80);
      return () => clearTimeout(t);
    }

    if (isVisible) return;

    const screenHeight = Dimensions.get("window").height;
    const buffer = screenHeight * 0.1;

    const checkAndAnimate = (scrollValue: number) => {
      if (isVisible || layoutY == null) return;
      const visibleBottom = scrollValue + screenHeight;
      if (visibleBottom >= layoutY + buffer) {
        animateIn();
      }
    };

    if (layoutY != null) {
      checkAndAnimate(0);
    }

    const id = scrollY.addListener(({ value }) => {
      checkAndAnimate(value);
    });

    return () => {
      scrollY.removeListener(id);
    };
  }, [scrollY, layoutY, isVisible, delay]);

  const animationStyle = {
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [60, 0],
        }),
      },
    ],
  };

  return {
    isVisible,
    viewRef,
    animationStyle,
    animValue,
    onLayout,
  };
};

/* -----------------------------------------------------
   ANIMATED COMPONENTS
----------------------------------------------------- */
const ScrollAnimatedView: React.FC<{
  children: React.ReactNode;
  style?: any;
  delay?: number;
  scrollY?: Animated.Value;
}> = ({ children, style, delay = 0, scrollY }) => {
  const { animationStyle, viewRef, onLayout } = useScrollAnimation(delay, scrollY);

  return (
    <Animated.View
      ref={viewRef}
      onLayout={onLayout}
      style={[style, animationStyle]}
    >
      {children}
    </Animated.View>
  );
};

const StaggeredScrollAnimation: React.FC<{
  children: React.ReactNode | React.ReactNode[];
  style?: any;
  itemDelay?: number;
  scrollY?: Animated.Value;
}> = ({ children, style, itemDelay = 100, scrollY }) => {
  const items = React.Children.toArray(children);

  return (
    <View style={style}>
      {items.map((child, index) => (
        <ScrollAnimatedView
          key={index}
          delay={index * itemDelay}
          scrollY={scrollY}
        >
          {child}
        </ScrollAnimatedView>
      ))}
    </View>
  );
};

/* -----------------------------------------------------
   RESPONSIVE CONTAINER COMPONENT
----------------------------------------------------- */
const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { width } = useWindowDimensions();
  
  const containerStyle = {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center" as const,
    paddingHorizontal: responsiveValue(16, 24, 40, width),
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

/* -----------------------------------------------------
   PREMIUM APP COMPONENT
----------------------------------------------------- */
const App: React.FC = () => {
  const scrollRef = useRef<ScrollView | null>(null);
  const videoRef = useRef<Video | null>(null);
  const { width, height } = useWindowDimensions();
  const s = (size: number) => scaleFont(size, width);

  // Responsive breakpoints
  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = width >= TABLET_BREAKPOINT;

  // Responsive values
  const sectionPadding = responsiveValue(48, 64, 96, width);
  const headerHeight = responsiveValue(60, 70, 80, width);
  const heroHeight = responsiveValue(
    Math.min(height * 0.75, 520),
    Math.min(height * 0.85, 600),
    Math.min(height * 0.9, 700),
    width
  );

  // STATE
  const [sectionPositions, setSectionPositions] = useState<Partial<Record<SectionKey, number>>>({});
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<PortfolioCategory>("all");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  // SCROLL-BASED ANIMATIONS
  const scrollY = useRef(new Animated.Value(0)).current;

  // PREMIUM ANIMATIONS
  const heroAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const currentSlide = HERO_SLIDES[activeSlideIndex];

  /* -----------------------------------------------------
     HERO AUTOPLAY & ANIMATIONS
  ----------------------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    heroAnim.setValue(0);
    Animated.parallel([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useDriver,
      }),
    ]).start();
  }, [activeSlideIndex, heroAnim, headerAnim]);

  /* -----------------------------------------------------
     SCROLL HANDLER
  ----------------------------------------------------- */
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrolled(y > 100);
    scrollY.setValue(y);
  };

  const handleSectionLayout = (key: SectionKey) => (event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => ({ ...prev, [key]: y }));
  };

  const scrollToSection = (key: SectionKey) => {
    const y = sectionPositions[key] ?? 0;
    scrollRef.current?.scrollTo({ y: y - (headerHeight * 0.8), animated: true });
    setNavOpen(false);
    setOpenDropdown(null);
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.email || !form.message) {
      Alert.alert("Missing info", "Please add at least your email and project details.");
      return;
    }
    Alert.alert("Brief sent", "We'll review your project and reply within one business day.");
    setForm({
      name: "",
      email: "",
      company: "",
      budget: "",
      message: "",
    });
  };

  const filteredPortfolio = portfolioFilter === "all"
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter((i) => i.category === portfolioFilter);

  /* -----------------------------------------------------
     NAV ITEMS
  ----------------------------------------------------- */
  const centerNavItems = [
    {
      key: "services",
      label: "Services",
      section: "services" as SectionKey,
      children: [
        { label: "Web App Development", section: "services" as SectionKey },
        { label: "Mobile App Development", section: "services" as SectionKey },
        { label: "UI/UX & Product Design", section: "services" as SectionKey },
        { label: "Cloud & Backend Engineering", section: "services" as SectionKey },
      ],
    },
    {
      key: "work",
      label: "Work",
      section: "work" as SectionKey,
      children: [
        { label: "Fintech & Banking", section: "work" as SectionKey },
        { label: "Healthcare & Telehealth", section: "work" as SectionKey },
        { label: "Retail & E-Commerce", section: "work" as SectionKey },
        { label: "Startups & SaaS", section: "work" as SectionKey },
      ],
    },
    {
      key: "process",
      label: "Process",
      section: "process" as SectionKey,
      children: [
        { label: "Delivery Playbook", section: "process" as SectionKey },
        { label: "Design Systems", section: "services" as SectionKey },
        { label: "Scalable Architectures", section: "process" as SectionKey },
      ],
    },
    {
      key: "about",
      label: "About",
      section: "testimonials" as SectionKey,
      children: [
        { label: "Our Team", section: "testimonials" as SectionKey },
        { label: "How We Work", section: "process" as SectionKey },
        { label: "Engagement Models", section: "contact" as SectionKey },
      ],
    },
  ];

  const mobileNavItems: { label: string; section: SectionKey }[] = [
    { label: "Services", section: "services" },
    { label: "Process", section: "process" },
    { label: "Work", section: "work" },
    { label: "Clients", section: "testimonials" },
    { label: "Contact", section: "contact" },
  ];

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => prev === 0 ? HERO_SLIDES.length - 1 : prev - 1);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  /* -----------------------------------------------------
     PROFESSIONAL FOOTER COMPONENT
  ----------------------------------------------------- */
  const ProfessionalFooter = () => (
    <View style={styles.footer}>
      <ResponsiveContainer>
        <View style={styles.footerContent}>
          {/* Main Footer Grid */}
          <View style={[styles.footerGrid, isMobile && styles.footerGridMobile]}>
            
            {/* Brand Column */}
            <View style={[styles.footerColumn, isMobile && styles.footerColumnMobile]}>
              <View style={styles.footerBrand}>
                <View style={styles.footerLogoContainer}>
                  <Image
                    source={CRAFTTECH_LOGO}
                    style={styles.footerLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.footerTitle, isMobile && styles.footerTitleMobile]}>CraftTech</Text>
                <Text style={[styles.footerTagline, isMobile && styles.footerTaglineMobile]}>
                  Building premium digital products for US startups, founders, and CTOs.
                </Text>
                
                {/* Social Links */}
                <View style={[styles.socialLinks, isMobile && styles.socialLinksMobile]}>
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL("https://twitter.com/crafttech")}
                  >
                    <Text style={styles.socialLinkText}>Twitter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL("https://www.linkedin.com/company/crafttech")}
                  >
                    <Text style={styles.socialLinkText}>LinkedIn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL("https://github.com/crafttech")}
                  >
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Services Column */}
            <View style={[styles.footerColumn, isMobile && styles.footerColumnMobile]}>
              <Text style={[styles.footerColumnTitle, isMobile && styles.footerColumnTitleMobile]}>Services</Text>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Web App Development</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Mobile App Development</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>UI/UX Design</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Cloud Engineering</Text>
              </TouchableOpacity>
            </View>

            {/* Work Column */}
            <View style={[styles.footerColumn, isMobile && styles.footerColumnMobile]}>
              <Text style={[styles.footerColumnTitle, isMobile && styles.footerColumnTitleMobile]}>Work</Text>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Fintech</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Healthcare</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>E-commerce</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>SaaS Platforms</Text>
              </TouchableOpacity>
            </View>

            {/* Contact Column */}
            <View style={[styles.footerColumn, isMobile && styles.footerColumnMobile]}>
              <Text style={[styles.footerColumnTitle, isMobile && styles.footerColumnTitleMobile]}>Contact</Text>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => scrollToSection("contact")}
              >
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>Start a Project</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => Linking.openURL("mailto:hello@crafttech.studio")}
              >
                <Text style={[styles.footerLinkText, isMobile && styles.footerLinkTextMobile]}>hello@crafttech.studio</Text>
              </TouchableOpacity>
              <Text style={[styles.contactHours, isMobile && styles.contactHoursMobile]}>
                Mon – Fri • US & PK friendly hours
              </Text>
              
              {/* CTA Button */}
              <TouchableOpacity 
                style={[styles.footerCta, isMobile && styles.footerCtaMobile]}
                onPress={() => scrollToSection("contact")}
              >
                <GradientView
                  colors={[COLORS.neonSoft, COLORS.neon]}
                  style={styles.footerCtaGradient}
                >
                  <Text style={[styles.footerCtaText, isMobile && styles.footerCtaTextMobile]}>Start your project</Text>
                </GradientView>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Bottom */}
          <View style={[styles.footerBottom, isMobile && styles.footerBottomMobile]}>
            <View style={styles.footerDivider} />
            <View style={[styles.footerBottomContent, isMobile && styles.footerBottomContentMobile]}>
              <Text style={[styles.footerCopy, isMobile && styles.footerCopyMobile]}>
                © {new Date().getFullYear()} CraftTech Studio. All rights reserved.
              </Text>
              <Text style={[styles.footerTech, isMobile && styles.footerTechMobile]}>
                Designed & built with TypeScript, React Native, and Expo Web.
              </Text>
            </View>
          </View>
        </View>
      </ResponsiveContainer>
    </View>
  );

  /* -----------------------------------------------------
     PREMIUM RENDER
  ----------------------------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* PREMIUM HEADER */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingHorizontal: responsiveValue(16, 24, 40, width),
          },
          scrolled && styles.headerScrolled,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Logo */}
        <TouchableOpacity
          style={styles.logoRow}
          activeOpacity={0.8}
          onPress={() => scrollToSection("hero")}
        >
          <View style={[styles.logoContainer, isMobile && styles.logoContainerMobile]}>
            <Image
              source={CRAFTTECH_LOGO}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={[styles.logoTitle, isMobile && styles.logoTitleMobile]}>
              CraftTech
            </Text>
            <Text style={[styles.logoSubtitle, isMobile && styles.logoSubtitleMobile]}>
              Digital Product Studio
            </Text>
          </View>
        </TouchableOpacity>

        {/* Center Navigation */}
        {(isTablet || isDesktop) && (
          <View style={[styles.navCenterRow, isTablet && styles.navCenterRowTablet]}>
            {centerNavItems.map((item) => (
              <View key={item.key} style={[styles.navCenterItem, isTablet && styles.navCenterItemTablet]}>
                <TouchableOpacity
                  onPress={() => scrollToSection(item.section)}
                  onLongPress={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                  delayLongPress={150}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.navCenterLabel, 
                    isTablet && styles.navCenterLabelTablet,
                    { fontSize: s(14) }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>

                {openDropdown === item.key && (
                  <View style={[
                    styles.dropdownMenu,
                    isTablet && styles.dropdownMenuTablet
                  ]}>
                    {item.children.map((child) => (
                      <TouchableOpacity
                        key={child.label}
                        style={styles.dropdownItem}
                        onPress={() => {
                          scrollToSection(child.section);
                          setOpenDropdown(null);
                        }}
                      >
                        <Text style={[styles.dropdownText, { fontSize: s(13) }]}>
                          {child.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CTA / Mobile Menu */}
        {isTablet || isDesktop ? (
          <TouchableOpacity
            style={[styles.navCta, isTablet && styles.navCtaTablet]}
            onPress={() => scrollToSection("contact")}
          >
            <GradientView
              colors={[COLORS.neonSoft, COLORS.neon]}
              style={[styles.navCtaGradient, isTablet && styles.navCtaGradientTablet]}
            >
              <Text style={[
                styles.navCtaText, 
                isTablet && styles.navCtaTextTablet,
                { fontSize: s(14) }
              ]}>
                Start your project
              </Text>
            </GradientView>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.burger}
            onPress={() => setNavOpen((prev) => !prev)}
          >
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
            <View style={[styles.burgerLine, navOpen && styles.burgerLineOpen]} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Mobile Navigation */}
      {isMobile && navOpen && (
        <View style={styles.mobileNav}>
          {mobileNavItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.mobileNavItem}
              onPress={() => scrollToSection(item.section)}
            >
              <Text style={[styles.mobileNavText, { fontSize: s(16) }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.navCta, styles.navCtaMobile]}
            onPress={() => scrollToSection("contact")}
          >
            <GradientView
              colors={[COLORS.neonSoft, COLORS.neon]}
              style={styles.navCtaGradient}
            >
              <Text style={[styles.navCtaText, { fontSize: s(14) }]}>
                Start your project
              </Text>
            </GradientView>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN SCROLL CONTENT */}
      <AnimatedScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* PREMIUM HERO SECTION */}
        <View
          onLayout={handleSectionLayout("hero")}
          style={[
            styles.hero,
            {
              height: heroHeight,
              minHeight: Math.max(heroHeight, 400),
            },
          ]}
        >
          <Video
            ref={videoRef}
            key={currentSlide.id}
            source={currentSlide.source}
            style={styles.heroVideo}
            shouldPlay
            isMuted
            isLooping
            resizeMode={ResizeMode.COVER}
            onLoad={() => setVideoReady(true)}
            onError={(e) => console.log("Video error:", e)}
          />

          {/* Dim overlay */}
          <View style={styles.heroOverlay} />

          {/* Content */}
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: heroAnim,
                transform: [
                  {
                    translateY: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <ResponsiveContainer style={styles.heroInner}>
              <View style={[
                styles.heroTextContainer,
                isMobile && styles.heroTextContainerMobile,
              ]}>
                <Text style={[styles.heroKicker, { fontSize: s(12) }]}>
                  DIGITAL PRODUCT STUDIO
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    {
                      fontSize: isMobile ? s(28) : isTablet ? s(36) : s(48),
                      lineHeight: isMobile ? s(36) : isTablet ? s(44) : s(56),
                      textAlign: isMobile ? "center" : "left",
                    },
                  ]}
                >
                  {currentSlide.title}
                </Text>
                <Text
                  style={[
                    styles.heroSubtitle,
                    {
                      fontSize: isMobile ? s(14) : s(18),
                      lineHeight: isMobile ? s(20) : s(26),
                      textAlign: isMobile ? "center" : "left",
                      maxWidth: 640,
                    },
                  ]}
                >
                  {currentSlide.subtitle}
                </Text>

                <View
                  style={[
                    styles.heroCtaRow,
                    isMobile && styles.heroCtaRowMobile,
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.heroPrimaryCta, isMobile && styles.heroPrimaryCtaMobile]}
                    onPress={() => scrollToSection("contact")}
                  >
                    <GradientView
                      colors={[COLORS.neonSoft, COLORS.neon]}
                      style={[styles.ctaGradient, isMobile && styles.ctaGradientMobile]}
                    >
                      <Text style={[styles.heroPrimaryText, { fontSize: s(16) }]}>
                        Start your project
                      </Text>
                    </GradientView>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.heroSecondaryCta, isMobile && styles.heroSecondaryCtaMobile]}
                    onPress={() => scrollToSection("services")}
                  >
                    <Text style={[styles.heroSecondaryText, { fontSize: s(16) }]}>
                      View our work
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ResponsiveContainer>
          </Animated.View>

          {/* Hero Controls */}
          <View style={[styles.heroControls, isMobile && styles.heroControlsMobile]}>
            <TouchableOpacity style={styles.heroArrow} onPress={handlePrevSlide}>
              <Text style={styles.heroArrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.heroDots}>
              {HERO_SLIDES.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveSlideIndex(index)}
                >
                  <View
                    style={[
                      styles.heroDot,
                      index === activeSlideIndex && styles.heroDotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.heroArrow} onPress={handleNextSlide}>
              <Text style={styles.heroArrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREMIUM SERVICES SECTION */}
        <View
          onLayout={handleSectionLayout("services")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <ResponsiveContainer>
            <ScrollAnimatedView scrollY={scrollY}>
              <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>
                  SERVICES
                </Text>
                <Text style={[
                  styles.sectionTitle, 
                  isMobile && styles.sectionTitleMobile,
                  { fontSize: s(32), lineHeight: s(40) }
                ]}>
                  End-to-end product delivery
                </Text>
                <Text style={[
                  styles.sectionSubtitle, 
                  isMobile && styles.sectionSubtitleMobile,
                  { fontSize: s(16), lineHeight: s(24) }
                ]}>
                  Strategy, design, and engineering for teams that ship serious software. 
                  We work with the same stacks your in-house engineers already love.
                </Text>
              </View>
            </ScrollAnimatedView>

            <StaggeredScrollAnimation
              itemDelay={150}
              style={[styles.servicesGrid, isMobile && styles.gridSingleColumn]}
              scrollY={scrollY}
            >
              {[
                {
                  title: "Product Strategy",
                  description: "We help you validate ideas, prioritise features, and align stakeholders before a single line of code is written.",
                  tech: ["MVP Roadmaps", "Discovery Workshops", "Product Analytics"],
                  icon: "🎯",
                },
                {
                  title: "Design & Experience",
                  description: "Premium product UX for web and mobile — clean, modern, and optimised for real-world usage.",
                  tech: ["Figma", "Design Systems", "Prototypes"],
                  icon: "🎨",
                },
                {
                  title: "Engineering & Launch",
                  description: "TypeScript-first builds on React, React Native, Node.js, and AWS — with performance and reliability in mind.",
                  tech: ["React", "Node.js", "TypeScript", "AWS"],
                  icon: "⚡",
                },
              ].map((service, index) => (
                <View key={index} style={[
                  styles.serviceCard, 
                  isMobile && styles.cardFullWidth,
                  isTablet && styles.serviceCardTablet,
                ]}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <Text style={styles.serviceNumber}>0{index + 1}</Text>
                  </View>
                  <Text style={[
                    styles.serviceCardTitle, 
                    isMobile && styles.textCenterMobile
                  ]}>{service.title}</Text>
                  <Text style={[
                    styles.serviceCardBody, 
                    isMobile && styles.textCenterMobile
                  ]}>{service.description}</Text>
                  <View style={[styles.techRow, isMobile && styles.techRowCenter]}>
                    {service.tech.map((tech) => (
                      <View key={tech} style={styles.techPill}>
                        <Text style={styles.techPillText}>{tech}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </StaggeredScrollAnimation>
          </ResponsiveContainer>
        </View>

        {/* PREMIUM PROCESS SECTION */}
        <View
          onLayout={handleSectionLayout("process")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <ResponsiveContainer>
            <ScrollAnimatedView scrollY={scrollY}>
              <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>PROCESS</Text>
                <Text style={[
                  styles.sectionTitle, 
                  isMobile && styles.sectionTitleMobile,
                  { fontSize: s(32), lineHeight: s(40) }
                ]}>
                  How we take you from brief to launch
                </Text>
                <Text style={[
                  styles.sectionSubtitle, 
                  isMobile && styles.sectionSubtitleMobile,
                  { fontSize: s(16), lineHeight: s(24) }
                ]}>
                  A simple, transparent flow that keeps founders, PMs, and CTOs in sync while we build.
                </Text>
              </View>
            </ScrollAnimatedView>

            <StaggeredScrollAnimation
              itemDelay={100}
              style={[styles.processGrid, isMobile && styles.gridSingleColumn]}
              scrollY={scrollY}
            >
              {[
                { step: "01 • Discover", title: "Research & Alignment", description: "Workshops, research, and requirements to get everyone aligned on the same problem and outcome." },
                { step: "02 • Design", title: "UX & Interface Design", description: "Flows, wireframes, and polished UI that reflect your brand and real user journeys." },
                { step: "03 • Build", title: "Engineering & Development", description: "Sprints with demos, reviews, and code that your in-house team can extend with confidence." },
                { step: "04 • Launch", title: "Deployment & Growth", description: "Rollout, monitoring, and iterative improvements based on real usage and product metrics." },
              ].map((item, index) => (
                <View key={index} style={[
                  styles.processCard, 
                  isMobile && styles.cardFullWidth,
                  isTablet && styles.processCardTablet,
                ]}>
                  <Text style={styles.processStep}>{item.step}</Text>
                  <Text style={[
                    styles.processCardTitle, 
                    isMobile && styles.textCenterMobile
                  ]}>{item.title}</Text>
                  <Text style={[
                    styles.processCardBody, 
                    isMobile && styles.textCenterMobile
                  ]}>{item.description}</Text>
                </View>
              ))}
            </StaggeredScrollAnimation>
          </ResponsiveContainer>
        </View>

        {/* PREMIUM WORK SECTION */}
        <View
          onLayout={handleSectionLayout("work")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <ResponsiveContainer>
            <ScrollAnimatedView scrollY={scrollY}>
              <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>WORK</Text>
                <Text style={[
                  styles.sectionTitle, 
                  isMobile && styles.sectionTitleMobile,
                  { fontSize: s(32), lineHeight: s(40) }
                ]}>
                  Products we've shipped with teams like yours
                </Text>
                <Text style={[
                  styles.sectionSubtitle, 
                  isMobile && styles.sectionSubtitleMobile,
                  { fontSize: s(16), lineHeight: s(24) }
                ]}>
                  A snapshot of the platforms we design and build for US startups, scaleups, and enterprises.
                </Text>
              </View>
            </ScrollAnimatedView>

            <ScrollAnimatedView delay={200} scrollY={scrollY}>
              <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
                {(["all", "web", "mobile", "ecommerce"] as PortfolioCategory[]).map((cat) => {
                  const LABELS: Record<PortfolioCategory, string> = {
                    all: "All Projects",
                    web: "Web Apps",
                    mobile: "Mobile Apps",
                    ecommerce: "E-commerce",
                  };
                  const active = portfolioFilter === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        isMobile && styles.filterChipMobile,
                        isTablet && styles.filterChipTablet,
                        active && styles.filterChipActive,
                      ]}
                      onPress={() => setPortfolioFilter(cat)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isMobile && styles.filterChipTextMobile,
                          active && styles.filterChipTextActive,
                          { fontSize: s(14) },
                        ]}
                      >
                        {LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollAnimatedView>

            <StaggeredScrollAnimation
              itemDelay={100}
              style={[styles.portfolioGrid, isMobile && styles.gridSingleColumn]}
              scrollY={scrollY}
            >
              {filteredPortfolio.map((item) => (
                <View key={item.id} style={[
                  styles.portfolioCard, 
                  isMobile && styles.cardFullWidth,
                  isTablet && styles.portfolioCardTablet,
                ]}>
                  <View style={styles.portfolioImageContainer}>
                    <Image
                      source={{ uri: item.img }}
                      style={styles.portfolioImage}
                      resizeMode="cover"
                    />
                    <View style={styles.portfolioOverlay}>
                      <Text style={styles.portfolioType}>{item.type}</Text>
                      <Text style={styles.portfolioTitle}>{item.title}</Text>
                    </View>
                  </View>
                  <View style={styles.portfolioContent}>
                    <Text style={[
                      styles.portfolioBody, 
                      isMobile && styles.textCenterMobile
                    ]}>{item.description}</Text>
                    <View style={[styles.portfolioMetrics, isMobile && styles.metricsCenterMobile]}>
                      {item.metrics.map((metric) => (
                        <View key={metric} style={styles.metricPill}>
                          <Text style={styles.metricPillText}>{metric}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </StaggeredScrollAnimation>
          </ResponsiveContainer>
        </View>

        {/* PREMIUM TESTIMONIALS SECTION */}
        <View
          onLayout={handleSectionLayout("testimonials")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <ResponsiveContainer>
            <ScrollAnimatedView scrollY={scrollY}>
              <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>CLIENTS</Text>
                <Text style={[
                  styles.sectionTitle, 
                  isMobile && styles.sectionTitleMobile,
                  { fontSize: s(32), lineHeight: s(40) }
                ]}>
                  What partners say
                </Text>
                <Text style={[
                  styles.sectionSubtitle, 
                  isMobile && styles.sectionSubtitleMobile,
                  { fontSize: s(16), lineHeight: s(24) }
                ]}>
                  Real feedback from founders, PMs, and CTOs we've partnered with across the US.
                </Text>
              </View>
            </ScrollAnimatedView>

            <StaggeredScrollAnimation
              itemDelay={120}
              style={[styles.testimonialsGrid, isMobile && styles.gridSingleColumn]}
              scrollY={scrollY}
            >
              {TESTIMONIALS.map((testimonial, index) => (
                <View key={testimonial.id} style={[
                  styles.testimonialCard, 
                  isMobile && styles.cardFullWidth,
                  isTablet && styles.testimonialCardTablet,
                ]}>
                  <Text style={styles.quoteMark}>"</Text>
                  <Text style={[
                    styles.testimonialText, 
                    isMobile && styles.textCenterMobile
                  ]}>{testimonial.quote}</Text>
                  <View style={[styles.testimonialFooter, isMobile && styles.testimonialFooterMobile]}>
                    <View style={isMobile && styles.testimonialInfoCenter}>
                      <Text style={[
                        styles.testimonialName, 
                        isMobile && styles.textCenterMobile
                      ]}>{testimonial.name}</Text>
                      <Text style={[
                        styles.testimonialRole, 
                        isMobile && styles.textCenterMobile
                      ]}>{testimonial.role}</Text>
                      <Text style={[
                        styles.testimonialCompany, 
                        isMobile && styles.textCenterMobile
                      ]}>{testimonial.company}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </StaggeredScrollAnimation>
          </ResponsiveContainer>
        </View>

        {/* PREMIUM CONTACT SECTION */}
        <View
          onLayout={handleSectionLayout("contact")}
          style={[styles.section, { paddingVertical: sectionPadding }]}
        >
          <ResponsiveContainer>
            <ScrollAnimatedView scrollY={scrollY}>
              <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
                <Text style={[styles.sectionLabel, { fontSize: s(14) }]}>CONTACT</Text>
                <Text style={[
                  styles.sectionTitle, 
                  isMobile && styles.sectionTitleMobile,
                  { fontSize: s(32), lineHeight: s(40) }
                ]}>
                  Tell us what you're building
                </Text>
                <Text style={[
                  styles.sectionSubtitle, 
                  isMobile && styles.sectionSubtitleMobile,
                  { fontSize: s(16), lineHeight: s(24) }
                ]}>
                  Share a quick summary of your product, your team, and your timeline. 
                  We'll respond with a short Loom and suggested next steps.
                </Text>
              </View>
            </ScrollAnimatedView>

            <View
              style={[
                styles.contactGrid,
                isMobile && styles.contactGridMobile,
              ]}
            >
              {/* LEFT: FORM */}
              <ScrollAnimatedView delay={200} scrollY={scrollY}>
                <View style={[
                  styles.contactForm,
                  isMobile && styles.contactFormMobile,
                ]}>
                  <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
                    <View style={[styles.formGroup, isMobile && styles.formGroupMobile]}>
                      <Text style={styles.inputLabel}>Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor={COLORS.subtle}
                        value={form.name}
                        onChangeText={(v) => handleFormChange("name", v)}
                      />
                    </View>
                    <View style={[styles.formGroup, isMobile && styles.formGroupMobile]}>
                      <Text style={styles.inputLabel}>Work email</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="you@company.com"
                        placeholderTextColor={COLORS.subtle}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(v) => handleFormChange("email", v)}
                      />
                    </View>
                  </View>

                  <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
                    <View style={[styles.formGroup, isMobile && styles.formGroupMobile]}>
                      <Text style={styles.inputLabel}>Company</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Company or startup name"
                        placeholderTextColor={COLORS.subtle}
                        value={form.company}
                        onChangeText={(v) => handleFormChange("company", v)}
                      />
                    </View>
                    <View style={[styles.formGroup, isMobile && styles.formGroupMobile]}>
                      <Text style={styles.inputLabel}>Rough budget (USD)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 20k – 60k"
                        placeholderTextColor={COLORS.subtle}
                        value={form.budget}
                        onChangeText={(v) => handleFormChange("budget", v)}
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, isMobile && styles.formGroupMobile]}>
                    <Text style={styles.inputLabel}>What are you looking to build?</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="App, platform, redesign, MVP…"
                      placeholderTextColor={COLORS.subtle}
                      multiline
                      numberOfLines={4}
                      value={form.message}
                      onChangeText={(v) => handleFormChange("message", v)}
                    />
                  </View>

                  <ScrollAnimatedView delay={400} scrollY={scrollY}>
                    <TouchableOpacity
                      style={[styles.submitButton, isMobile && styles.submitButtonMobile]}
                      onPress={handleSubmit}
                    >
                      <GradientView
                        colors={[COLORS.neonSoft, COLORS.neon]}
                        style={styles.submitGradient}
                      >
                        <Text style={styles.submitButtonText}>Send brief</Text>
                      </GradientView>
                    </TouchableOpacity>
                  </ScrollAnimatedView>
                </View>
              </ScrollAnimatedView>

              {/* RIGHT: INFO CARD */}
              <ScrollAnimatedView delay={400} scrollY={scrollY}>
                <View
                  style={[
                    styles.contactInfo,
                    isMobile && styles.contactInfoMobile,
                  ]}
                >
                  <View style={[
                    styles.contactInfoCard,
                    isMobile && styles.contactInfoCardMobile,
                  ]}>
                    <Text style={[
                      styles.contactInfoTitle,
                      isMobile && styles.textCenterMobile
                    ]}>
                      Based in Pakistan, building for the US.
                    </Text>
                    <Text style={[
                      styles.contactInfoBody,
                      isMobile && styles.textCenterMobile
                    ]}>
                      We're a distributed product squad working with founders, product
                      leaders, and CTOs across North America. Expect clear async
                      communication and real momentum.
                    </Text>

                    <View style={styles.contactInfoBox}>
                      <Text style={styles.contactInfoLabel}>Engagements</Text>
                      <Text style={styles.contactInfoBody}>
                        • 8–16 week product sprints{"\n"}
                        • Dedicated PM, design, and engineering{"\n"}
                        • Slack, Notion, and Loom-native collaboration
                      </Text>
                    </View>

                    <View style={styles.contactInfoBox}>
                      <Text style={styles.contactInfoLabel}>Contact</Text>
                      <Text style={styles.contactInfoBody}>
                        hello@crafttech.studio{"\n"}
                        Mon – Fri • US & PK friendly hours
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollAnimatedView>
            </View>
          </ResponsiveContainer>
        </View>

        {/* PROFESSIONAL FOOTER */}
        <ProfessionalFooter />
      </AnimatedScrollView>
    </SafeAreaView>
  );
};

export default App;

/* -----------------------------------------------------
   PROFESSIONAL STYLES WITH ENHANCED RESPONSIVENESS
----------------------------------------------------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    minWidth: MIN_WIDTH,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
    backgroundColor: 'transparent',
    minHeight: 60,
  },
  headerScrolled: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },  
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  logoContainerMobile: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  logoTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    minWidth: 100,
  },
  logoTitleMobile: {
    fontSize: 18,
  },
  logoSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  logoSubtitleMobile: {
    fontSize: 10,
  },
  navCenterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  navCenterRowTablet: {
    gap: 24,
  },
  navCenterItem: {
    position: "relative",
  },
  navCenterItemTablet: {
    minWidth: 60,
  },
  navCenterLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.2,
    minWidth: 60,
  },
  navCenterLabelTablet: {
    fontSize: 13,
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    left: -16,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 200,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  dropdownMenuTablet: {
    minWidth: 180,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
  },
  dropdownText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "400",
  },
  navCta: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 40,
  },
  navCtaTablet: {
    minHeight: 36,
  },
  navCtaMobile: {
    marginTop: 16,
    width: "100%",
  },
  navCtaGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 140,
  },
  navCtaGradientTablet: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 130,
  },
  navCtaText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  navCtaTextTablet: {
    fontSize: 13,
  },
  burger: {
    padding: 8,
    width: 32,
    height: 32,
    justifyContent: "space-between",
  },
  burgerLine: {
    height: 2,
    backgroundColor: COLORS.text,
    borderRadius: 2,
  },
  burgerLineOpen: {
    backgroundColor: COLORS.neon,
  },
  mobileNav: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 90,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileNavItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    minHeight: 48,
  },
  mobileNavText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    backgroundColor: COLORS.bg,
    minWidth: MIN_WIDTH,
  },

  // PREMIUM HERO
  hero: {
    position: "relative",
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    marginVertical: 0,
    minHeight: 400,
  },    
  heroVideo: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5,8,7,0.18)",
  },  
  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 0,
  },  
  heroInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  heroTextContainer: {
    maxWidth: 640,
    alignItems: "flex-start",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  heroTextContainerMobile: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
   
  heroKicker: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
    minHeight: 16,
  },
  heroTitle: {
    color: COLORS.text,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: -0.5,
    marginBottom: 20,
    minHeight: 40,
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    textAlign: "left",
    fontWeight: "400",
    marginBottom: 28,
    opacity: 0.9,
    minHeight: 24,
  },    
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 50,
  },
  heroCtaRowMobile: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  heroPrimaryCta: {
    borderRadius: 999,
    overflow: "hidden",
    minWidth: 180,
  },
  heroPrimaryCtaMobile: {
    width: "100%",
  },
  ctaGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  ctaGradientMobile: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  heroPrimaryText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  heroSecondaryCta: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(10,15,13,0.85)",
    minWidth: 140,
    minHeight: 48,
  },
  heroSecondaryCtaMobile: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  heroSecondaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },  
  heroControls: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    minHeight: 40,
  },
  heroControlsMobile: {
    paddingHorizontal: 16,
    bottom: 20,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    minHeight: 40,
  },
  heroArrowText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "400",
  },  
  heroDots: {
    flexDirection: "row",
    gap: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    minWidth: 8,
    minHeight: 8,
  },
  heroDotActive: {
    backgroundColor: COLORS.neon,
    width: 24,
    minWidth: 24,
  },

  // SECTIONS
  section: {
    paddingVertical: 80,
    minWidth: MIN_WIDTH,
  },
  sectionHeader: {
    marginBottom: 60,
    alignItems: "center",
    textAlign: "center",
    minHeight: 80,
  },
  sectionHeaderMobile: {
    marginBottom: 40,
    paddingHorizontal: 8,
    minHeight: 60,
  },
  sectionLabel: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    minHeight: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 16,
    minHeight: 40,
  },
  sectionTitleMobile: {
    fontSize: 28,
    lineHeight: 36,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 24,
    minHeight: 48,
  },
  sectionSubtitleMobile: {
    fontSize: 14,
    lineHeight: 22,
  },

  // RESPONSIVE GRID LAYOUTS
  gridSingleColumn: {
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "stretch",
    gap: 24,
  },
  
  cardFullWidth: {
    width: "100%",
    minWidth: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    flex: 0,
  },
  
  textCenterMobile: {
    textAlign: "center",
  },

  // SERVICES
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
    minWidth: MIN_WIDTH,
  },
  serviceCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 320,
  },
  serviceCardTablet: {
    minWidth: 280,
    maxWidth: 350,
    padding: 24,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    minHeight: 32,
  },
  serviceIcon: {
    fontSize: 32,
  },
  serviceNumber: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
  },
  serviceCardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    minHeight: 28,
  },
  serviceCardBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    minHeight: 66,
  },

  // PROCESS
  processGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
    minWidth: MIN_WIDTH,
  },
  processCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 240,
  },
  processCardTablet: {
    minWidth: 260,
    maxWidth: 300,
    padding: 24,
  },
  processStep: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    minHeight: 20,
  },
  processCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    minHeight: 26,
  },
  processCardBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 66,
  },

  // WORK
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 40,
    minHeight: 40,
  },
  filterRowMobile: {
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    minHeight: 40,
  },
  filterChipMobile: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  filterChipTablet: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: COLORS.neon,
    borderColor: COLORS.neon,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  filterChipTextMobile: {
    fontSize: 13,
  },
  filterChipTextActive: {
    color: COLORS.bg,
    fontWeight: "600",
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
    minWidth: MIN_WIDTH,
  },
  portfolioCard: {
    flex: 1,
    minWidth: 350,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 500,
  },
  portfolioCardTablet: {
    minWidth: 320,
    maxWidth: 360,
  },
  portfolioImageContainer: {
    position: "relative",
    width: "100%",
    height: 240,
    minHeight: 240,
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
  },
  portfolioOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    minHeight: 80,
  },
  portfolioType: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    minHeight: 16,
  },
  portfolioTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    minHeight: 28,
  },
  portfolioContent: {
    padding: 24,
    minHeight: 180,
  },
  portfolioBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    minHeight: 66,
  },
  portfolioMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 32,
  },
  metricsCenterMobile: {
    justifyContent: "center",
  },

  // TESTIMONIALS
  testimonialsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
    minWidth: MIN_WIDTH,
  },
  testimonialCard: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 320,
  },
  testimonialCardTablet: {
    minWidth: 300,
    maxWidth: 350,
    padding: 24,
  },
  quoteMark: {
    color: COLORS.neon,
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    minHeight: 48,
  },
  testimonialText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: "italic",
    minHeight: 72,
  },
  testimonialFooter: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
  },
  testimonialFooterMobile: {
    justifyContent: "center",
  },
  testimonialInfoCenter: {
    alignItems: "center",
  },
  testimonialName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    minHeight: 22,
  },
  testimonialRole: {
    color: COLORS.neon,
    fontSize: 14,
    marginTop: 2,
    minHeight: 20,
  },
  testimonialCompany: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
    minHeight: 20,
  },

  // CONTACT
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 48,
    minWidth: MIN_WIDTH,
  },
  contactGridMobile: {
    flexDirection: "column",
    gap: 32,
  },
  contactForm: {
    flex: 2,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 500,
  },
  contactFormMobile: {
    padding: 24,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    minHeight: 80,
  },
  formRowMobile: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
    minHeight: 80,
  },
  formGroupMobile: {
    width: "100%",
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    minHeight: 20,
  },
  input: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
    minHeight: 120,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 24,
    minHeight: 56,
  },
  submitButtonMobile: {
    width: "100%",
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 56,
  },
  submitButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
    minWidth: 300,
    paddingHorizontal: 4,
  },  
  contactInfoMobile: {
    minWidth: 0,
    paddingHorizontal: 0,
    marginTop: 0,
  },
  contactInfoTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    minHeight: 32,
  },
  contactInfoBody: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    minHeight: 48,
  },
  contactInfoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },
  contactInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 500,
  },  
  contactInfoCardMobile: {
    padding: 20,
  },
  contactInfoLabel: {
    color: COLORS.neon,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    minHeight: 20,
  },

  // TECH PILLS & METRICS
  techRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 32,
  },
  techRowCenter: {
    justifyContent: "center",
  },
  techPill: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 28,
    minWidth: 60,
  },
  techPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  metricPill: {
    backgroundColor: COLORS.bgSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 28,
    minWidth: 60,
  },
  metricPillText: {
    color: COLORS.neon,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // PROFESSIONAL FOOTER STYLES
  footer: {
    backgroundColor: COLORS.bgSoft,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 80,
    minWidth: MIN_WIDTH,
  },
  footerContent: {
    paddingVertical: 80,
  },
  footerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 48,
    minHeight: 300,
  },
  footerGridMobile: {
    flexDirection: "column",
    gap: 40,
  },
  footerColumn: {
    flex: 1,
    minWidth: 200,
    minHeight: 200,
  },
  footerColumnMobile: {
    minWidth: "100%",
    alignItems: "center",
    textAlign: "center",
  },
  footerBrand: {
    marginBottom: 0,
    minHeight: 200,
  },
  footerLogoContainer: {
    width: 48,
    height: 48,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 48,
    minHeight: 48,
  },
  footerLogoImage: {
    width: "100%",
    height: "100%",
  },
  footerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    minHeight: 32,
  },
  footerTitleMobile: {
    fontSize: 22,
    textAlign: "center",
  },
  footerTagline: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
    minHeight: 72,
  },
  footerTaglineMobile: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: "100%",
  },
  socialLinks: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    minHeight: 40,
  },
  socialLinksMobile: {
    justifyContent: "center",
  },
  socialLink: {
    paddingVertical: 8,
    minHeight: 32,
  },
  socialLinkText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  footerColumnTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    minHeight: 24,
  },
  footerColumnTitleMobile: {
    fontSize: 16,
    textAlign: "center",
  },
  footerLink: {
    paddingVertical: 8,
    minHeight: 40,
  },
  footerLinkText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "400",
  },
  footerLinkTextMobile: {
    fontSize: 14,
    textAlign: "center",
  },
  contactHours: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
    minHeight: 20,
  },
  contactHoursMobile: {
    fontSize: 13,
    textAlign: "center",
  },
  footerCta: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    minHeight: 48,
  },
  footerCtaMobile: {
    width: "100%",
  },
  footerCtaGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  footerCtaText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footerCtaTextMobile: {
    fontSize: 13,
  },
  footerBottom: {
    marginTop: 60,
    minHeight: 100,
  },
  footerBottomMobile: {
    marginTop: 40,
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 32,
    minHeight: 1,
  },
  footerBottomContent: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 60,
  },
  
  footerBottomContentMobile: {
    gap: 8,
  },
  
  footerCopy: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    minHeight: 20,
  },
  
  footerCopyMobile: {
    fontSize: 13,
  },
  
  footerTech: {
    color: COLORS.textMuted,
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    minHeight: 20,
  },  
  footerTechMobile: {
    fontSize: 12,
  },
});