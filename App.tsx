import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { AuthProvider, useAuth, UserRole } from './src/auth/AuthProvider';
import AuthScreen from './src/auth/AuthScreen';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type Page = 'home' | 'courses' | 'my-learning' | 'teaching' | 'management';
type Course = {
  title: string;
  category: string;
  instructor: string;
  lessons: number;
  progress: number;
  color: string;
  icon: string;
};

const courses: Course[] = [
  {
    title: 'أساسيات التمريض',
    category: 'تمريض عام',
    instructor: 'د. سارة أحمد',
    lessons: 18,
    progress: 68,
    color: '#E7F1E9',
    icon: '✚',
  },
  {
    title: 'التشريح ووظائف الأعضاء',
    category: 'علوم طبية',
    instructor: 'د. عمر خالد',
    lessons: 24,
    progress: 32,
    color: '#F7EBDD',
    icon: '◉',
  },
  {
    title: 'تمريض الحالات الحرجة',
    category: 'تمريض متخصص',
    instructor: 'أ. منى إبراهيم',
    lessons: 16,
    progress: 0,
    color: '#E9E8F4',
    icon: '♡',
  },
  {
    title: 'علم الأدوية',
    category: 'علوم طبية',
    instructor: 'د. ياسر محمود',
    lessons: 20,
    progress: 0,
    color: '#F4E9E7',
    icon: '◌',
  },
];

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'home', label: 'الرئيسية', icon: '⌂' },
  { id: 'courses', label: 'استكشف المواد', icon: '▤' },
  { id: 'my-learning', label: 'تعلمي', icon: '◷' },
  { id: 'teaching', label: 'لوحة المدرّس', icon: '▧' },
  { id: 'management', label: 'إدارة المنصة', icon: '⚙' },
];

const pageTitles: Record<Page, string> = {
  home: 'مساحة تعلّمك',
  courses: 'استكشف المواد',
  'my-learning': 'رحلتي التعليمية',
  teaching: 'مساحة المدرّس',
  management: 'إدارة المنصة',
};

function Platform() {
  const { width } = useWindowDimensions();
  const auth = useAuth();
  const wide = width >= 980;
  const [page, setPage] = useState<Page>('home');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const displayName = auth.profile?.full_name || 'نور محمد';
  const role: UserRole = auth.profile?.role || 'student';

  if (auth.configured && auth.loading) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator color="#315D45" size="large" />
        <Text style={styles.authLoadingText}>جارٍ تحميل حسابك...</Text>
      </View>
    );
  }

  if (auth.configured && !auth.session) {
    return <AuthScreen profileError={auth.profileError} />;
  }

  if (auth.configured && !auth.profile) {
    return (
      <View style={styles.authLoading}>
        <Text style={styles.accountErrorTitle}>تعذّر تحميل الحساب</Text>
        <Text style={styles.authLoadingText}>
          {auth.profileError || 'لم يتم العثور على ملف الحساب.'}
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            auth.signOut().catch((error: unknown) =>
              setNotice(
                error instanceof Error ? error.message : 'تعذّر تسجيل الخروج.',
              ),
            )
          }
        >
          <Text style={styles.primaryButtonText}>تسجيل الخروج</Text>
        </Pressable>
      </View>
    );
  }

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim();
    return courses.filter((course) => {
      const matchesQuery =
        !normalizedQuery ||
        course.title.includes(normalizedQuery) ||
        course.category.includes(normalizedQuery) ||
        course.instructor.includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === 'الكل' || course.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, selectedCategory]);

  const goTo = (nextPage: Page) => {
    setPage(nextPage);
    setNotice('');
  };

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      {wide && (
        <Sidebar
          activePage={page}
          onNavigate={goTo}
          onNotice={setNotice}
          displayName={displayName}
          role={role}
          demoMode={!auth.configured}
        />
      )}
      <View style={styles.main}>
        <Header
          displayName={displayName}
          onNavigate={goTo}
          onSignOut={
            auth.configured
              ? () =>
                  auth.signOut().catch((error: unknown) =>
                    setNotice(
                      error instanceof Error
                        ? error.message
                        : 'تعذّر تسجيل الخروج.',
                    ),
                  )
              : undefined
          }
          onNotice={setNotice}
        />
        <ScrollView
          contentContainerStyle={[styles.content, wide && styles.wideContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeading}>
            <View>
              <Text style={styles.eyebrow}>منصة رِفْق للتعلّم التمريضي</Text>
              <Text style={styles.pageTitle}>{pageTitles[page]}</Text>
            </View>
            <View style={styles.rolePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.roleText}>
                {auth.configured ? 'حساب متصل' : 'مساحة تجريبية'}
              </Text>
            </View>
          </View>

          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
              <Pressable onPress={() => setNotice('')} accessibilityLabel="إغلاق">
                <Text style={styles.noticeClose}>×</Text>
              </Pressable>
            </View>
          ) : null}

          {page === 'home' && (
            <HomePage
              wide={wide}
              onNavigate={goTo}
              onNotice={setNotice}
              courses={filteredCourses}
              query={query}
              onQueryChange={setQuery}
            />
          )}
          {page === 'courses' && (
            <CoursesPage
              courses={filteredCourses}
              query={query}
              onQueryChange={setQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNotice={setNotice}
            />
          )}
          {page === 'my-learning' && (
            <LearningPage courses={filteredCourses} onNotice={setNotice} />
          )}
          {page === 'teaching' && <TeachingPage onNotice={setNotice} />}
          {page === 'management' && <ManagementPage onNotice={setNotice} />}
        </ScrollView>
        {!wide && (
          <MobileNav
            activePage={page}
            onNavigate={goTo}
            role={role}
            demoMode={!auth.configured}
          />
        )}
      </View>
    </View>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  onNotice,
  displayName,
  role,
  demoMode,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onNotice: (message: string) => void;
  displayName: string;
  role: UserRole;
  demoMode: boolean;
}) {
  const visibleItems = navItems.filter(
    (item) =>
      demoMode ||
      (item.id !== 'teaching' && item.id !== 'management') ||
      (item.id === 'teaching' && role === 'teacher') ||
      (item.id === 'management' && role === 'admin'),
  );
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>ر</Text>
        </View>
        <View>
          <Text style={styles.brandName}>رِفْق</Text>
          <Text style={styles.brandSub}>تعلّم التمريض</Text>
        </View>
      </View>
      <Text style={styles.navCaption}>القائمة الرئيسية</Text>
      <View style={styles.navList}>
        {visibleItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={item.id === activePage}
            onPress={() => onNavigate(item.id)}
          />
        ))}
      </View>
      <View style={styles.sidebarSpacer} />
      <View style={styles.helpCard}>
        <Text style={styles.helpIcon}>✦</Text>
        <Text style={styles.helpTitle}>هل تحتاج مساعدة؟</Text>
        <Text style={styles.helpCopy}>فريقنا هنا لمساعدتك في رحلتك.</Text>
        <Pressable
          style={styles.helpButton}
          onPress={() => onNotice('تواصل معنا عبر support@refq.example')}
        >
          <Text style={styles.helpButtonText}>تواصل معنا</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.profileRow}
        onPress={() => onNotice('سيكون تسجيل الدخول متاحًا بعد ربط Supabase.')}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>ن</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>{roleLabel(role)}</Text>
        </View>
        <Text style={styles.profileMore}>···</Text>
      </Pressable>
    </View>
  );
}

function NavButton({
  item,
  active,
  onPress,
}: {
  item: { id: Page; label: string; icon: string };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navButton, active && styles.navButtonActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.navIcon, active && styles.navIconActive]}>
        {item.icon}
      </Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {item.label}
      </Text>
      {active && <View style={styles.activeMarker} />}
    </Pressable>
  );
}

function Header({
  onNavigate,
  onNotice,
  onSignOut,
  displayName,
}: {
  onNavigate: (page: Page) => void;
  onNotice: (message: string) => void;
  onSignOut?: () => void;
  displayName: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>رِفْق</Text>
        <Text style={styles.breadcrumbDivider}>/</Text>
        <Text style={styles.breadcrumbCurrent}>منصة التعلّم</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable
          style={styles.headerAction}
          onPress={() => onNotice('لا توجد إشعارات جديدة.')}
          accessibilityLabel="الإشعارات"
        >
          <Text style={styles.headerActionIcon}>♧</Text>
          <View style={styles.notificationDot} />
        </Pressable>
        <View style={styles.headerDivider} />
        <Pressable
          style={styles.headerUser}
          onPress={() =>
            onSignOut
              ? onSignOut()
              : onNavigate('my-learning')
          }
        >
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>ن</Text>
          </View>
          <View>
            <Text style={styles.headerUserName}>{displayName}</Text>
            <Text style={styles.headerUserLabel}>حسابي · تسجيل الخروج</Text>
          </View>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HomePage({
  wide,
  onNavigate,
  onNotice,
  courses: visibleCourses,
  query,
  onQueryChange,
}: {
  wide: boolean;
  onNavigate: (page: Page) => void;
  onNotice: (message: string) => void;
  courses: Course[];
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <>
      <View style={[styles.hero, !wide && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <View style={styles.heroLabel}>
            <Text style={styles.heroLabelText}>خطوة صغيرة، أثر كبير</Text>
          </View>
          <Text style={styles.heroTitle}>رعايتك تبدأ من هنا.</Text>
          <Text style={styles.heroDescription}>
            تعلّمي بثقة، واصنعي فرقًا في حياة كل مريض.
            {'\n'}رحلتك لتصبحي ممرضة متميزة تبدأ بخطوة.
          </Text>
          <Pressable
            style={styles.heroButton}
            onPress={() => onNavigate('courses')}
          >
            <Text style={styles.heroButtonText}>اكتشفي المواد</Text>
            <Text style={styles.heroButtonArrow}>←</Text>
          </Pressable>
        </View>
        <View style={styles.heroArt}>
          <View style={styles.artCircleOuter}>
            <View style={styles.artCircleInner}>
              <Text style={styles.artPlus}>✚</Text>
              <Text style={styles.artLabel}>رعاية</Text>
            </View>
          </View>
          <View style={styles.artSparkleOne}>
            <Text style={styles.artSparkle}>✦</Text>
          </View>
          <View style={styles.artSparkleTwo}>
            <Text style={styles.artSparkle}>✧</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="▤" value="٤" label="مواد في خطتك" accent="#2F7159" />
        <StatCard icon="◷" value="١٢" label="ساعة تعلّم" accent="#C78542" />
        <StatCard icon="✦" value="٦٨٪" label="متوسط التقدم" accent="#7780A5" />
        <StatCard icon="♧" value="٣" label="أيام متتالية" accent="#A76F65" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>تابعي من حيث توقفتِ</Text>
          <Text style={styles.sectionSubtitle}>استمري، أنتِ تحرزين تقدمًا رائعًا</Text>
        </View>
        <Pressable onPress={() => onNavigate('my-learning')}>
          <Text style={styles.linkText}>عرض الكل ←</Text>
        </Pressable>
      </View>
      <View style={styles.courseGrid}>
        {visibleCourses
          .filter((course) => course.progress > 0)
          .slice(0, 2)
          .map((course) => (
            <CourseCard
              key={course.title}
              course={course}
              onPress={() => onNotice(`سيتم فتح دروس ${course.title} قريبًا.`)}
            />
          ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>اقتراحات لكِ</Text>
          <Text style={styles.sectionSubtitle}>مواد مختارة لتكملي مسيرتك</Text>
        </View>
        <Pressable onPress={() => onNavigate('courses')}>
          <Text style={styles.linkText}>كل المواد ←</Text>
        </Pressable>
      </View>
      <SearchBox value={query} onChange={onQueryChange} />
      <View style={styles.courseGrid}>
        {visibleCourses
          .filter((course) => course.progress === 0)
          .slice(0, 2)
          .map((course) => (
            <CourseCard
              key={course.title}
              course={course}
              onPress={() => onNotice(`سيتم فتح ${course.title} قريبًا.`)}
            />
          ))}
      </View>
    </>
  );
}

function CoursesPage({
  courses: visibleCourses,
  query,
  onQueryChange,
  selectedCategory,
  onSelectCategory,
  onNotice,
}: {
  courses: Course[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onNotice: (message: string) => void;
}) {
  const categories = ['الكل', 'تمريض عام', 'علوم طبية', 'تمريض متخصص'];
  return (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>معرفة اليوم، رعاية أفضل غدًا.</Text>
        <Text style={styles.introCopy}>
          اكتشفي مواد صُمّمت لتدعمك من أساسيات التمريض وحتى الممارسة المتخصصة.
        </Text>
      </View>
      <SearchBox value={query} onChange={onQueryChange} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.resultsText}>{visibleCourses.length} مواد تعليمية</Text>
      <View style={styles.courseGrid}>
        {visibleCourses.length ? (
          visibleCourses.map((course) => (
            <CourseCard
              key={course.title}
              course={course}
              onPress={() => onNotice(`سيتم فتح ${course.title} قريبًا.`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>لم نعثر على نتائج</Text>
            <Text style={styles.emptyCopy}>جرّبي كلمة بحث أو تصنيفًا آخر.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function LearningPage({
  courses: visibleCourses,
  onNotice,
}: {
  courses: Course[];
  onNotice: (message: string) => void;
}) {
  const enrolled = visibleCourses.filter((course) => course.progress > 0);
  return (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>كل درس يقربك من هدفك.</Text>
        <Text style={styles.introCopy}>
          راجعي تقدمك وواصلي التعلّم بالوتيرة التي تناسبك.
        </Text>
      </View>
      <View style={styles.learningSummary}>
        <Text style={styles.summaryNumber}>٦٨٪</Text>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>تقدمك الإجمالي</Text>
          <Text style={styles.summaryDescription}>أحسنتِ! واصلي على هذا النحو.</Text>
        </View>
        <ProgressBar value={68} />
      </View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>موادك الحالية</Text>
          <Text style={styles.sectionSubtitle}>المواد التي بدأتِ بها</Text>
        </View>
      </View>
      <View style={styles.courseGrid}>
        {enrolled.length ? (
          enrolled.map((course) => (
            <CourseCard
              key={course.title}
              course={course}
              onPress={() => onNotice(`سيتم فتح دروس ${course.title} قريبًا.`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>ابدئي رحلتك التعليمية</Text>
            <Text style={styles.emptyCopy}>سجّلي في مادة لتتبعي تقدمك هنا.</Text>
          </View>
        )}
      </View>
    </>
  );
}

function TeachingPage({ onNotice }: { onNotice: (message: string) => void }) {
  return (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>شاركي خبرتك مع الجيل القادم.</Text>
        <Text style={styles.introCopy}>
          أنشئي مواد تعليمية، أضيفي الدروس، وتابعي تفاعل طلابك.
        </Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="▤" value="٠" label="مقرراتي" accent="#2F7159" />
        <StatCard icon="♧" value="٠" label="الطلاب" accent="#C78542" />
        <StatCard icon="✦" value="—" label="متوسط التقييم" accent="#7780A5" />
      </View>
      <View style={styles.actionPanel}>
        <View style={styles.actionPanelCopy}>
          <Text style={styles.sectionTitle}>ابدئي ببناء مقررك الأول</Text>
          <Text style={styles.sectionSubtitle}>
            أضيفي عنوان المقرر ووصفه ثم ارفعي الدروس والاختبارات.
          </Text>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            onNotice('لإنشاء مقرر، سجّلي الدخول بحساب مُدرّس بعد إعداد Supabase.')
          }
        >
          <Text style={styles.primaryButtonText}>＋  إنشاء مقرر</Text>
        </Pressable>
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>مساحة التدريس جاهزة لك</Text>
        <Text style={styles.emptyCopy}>
          بعد تسجيل الدخول بصلاحية مدرّس، ستظهر مقرراتك وإحصاءات الطلاب هنا.
        </Text>
      </View>
    </>
  );
}

function ManagementPage({
  onNotice,
}: {
  onNotice: (message: string) => void;
}) {
  return (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>إدارة المحتوى والمستخدمين.</Text>
        <Text style={styles.introCopy}>
          مساحة مخصصة للمشرفين لإدارة المنصة ومراجعة المواد التعليمية.
        </Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="▤" value="٤" label="مواد تجريبية" accent="#2F7159" />
        <StatCard icon="♧" value="١" label="مستخدم تجريبي" accent="#C78542" />
        <StatCard icon="◷" value="٠" label="مواد بانتظار المراجعة" accent="#7780A5" />
      </View>
      <View style={styles.managementList}>
        <ManagementRow
          icon="▤"
          title="إدارة المقررات"
          detail="إنشاء المقررات وتحديثها ومراجعتها"
          onPress={() => onNotice('تتطلب إدارة المقررات صلاحية مشرف وتسجيل دخول.')}
        />
        <ManagementRow
          icon="♧"
          title="إدارة المستخدمين"
          detail="إدارة حسابات الطلاب والمدرّسين"
          onPress={() => onNotice('تتطلب إدارة المستخدمين صلاحية مشرف وتسجيل دخول.')}
        />
        <ManagementRow
          icon="⚙"
          title="إعدادات المنصة"
          detail="إعدادات التسجيل وإشعارات المنصة"
          onPress={() => onNotice('تتطلب إعدادات المنصة صلاحية مشرف وتسجيل دخول.')}
        />
      </View>
      <View style={styles.secureHint}>
        <Text style={styles.secureIcon}>◇</Text>
        <Text style={styles.secureHintText}>
          صلاحيات المشرف تُضبط بأمان من قاعدة البيانات، ولا يمكن للمستخدم منحها لنفسه.
        </Text>
      </View>
    </>
  );
}

function ManagementRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.managementRow} onPress={onPress}>
      <View style={styles.managementIcon}>
        <Text style={styles.managementIconText}>{icon}</Text>
      </View>
      <View style={styles.managementCopy}>
        <Text style={styles.managementTitle}>{title}</Text>
        <Text style={styles.managementDetail}>{detail}</Text>
      </View>
      <Text style={styles.managementArrow}>←</Text>
    </Pressable>
  );
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}16` }]}>
        <Text style={[styles.statIcon, { color: accent }]}>{icon}</Text>
      </View>
      <View style={styles.statTextWrap}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.searchBox}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="ابحثي عن مادة، موضوع أو مدرّس..."
        placeholderTextColor="#8B9690"
        style={styles.searchInput}
        textAlign="right"
        accessibilityLabel="ابحثي عن مادة"
      />
    </View>
  );
}

function CourseCard({
  course,
  onPress,
}: {
  course: Course;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.courseCard} onPress={onPress}>
      <View style={[styles.courseArt, { backgroundColor: course.color }]}>
        <View style={styles.courseArtCircle}>
          <Text style={styles.courseArtIcon}>{course.icon}</Text>
        </View>
        <View style={styles.courseCategory}>
          <Text style={styles.courseCategoryText}>{course.category}</Text>
        </View>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseInstructor}>{course.instructor}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.courseMetaText}>{course.lessons} درسًا</Text>
          <Text style={styles.courseMetaDot}>•</Text>
          <Text style={styles.courseMetaText}>
            {course.progress ? `${course.progress}% مكتمل` : 'ابدئي الآن'}
          </Text>
        </View>
        {course.progress > 0 && <ProgressBar value={course.progress} />}
        <View style={styles.courseFooter}>
          <Text style={styles.courseFooterText}>
            {course.progress ? 'متابعة التعلّم' : 'عرض المادة'}
          </Text>
          <Text style={styles.courseArrow}>←</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View
      style={styles.progressTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
    >
      <View style={[styles.progressFill, { width: `${value}%` }]} />
    </View>
  );
}

function MobileNav({
  activePage,
  onNavigate,
  role,
  demoMode,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  role: UserRole;
  demoMode: boolean;
}) {
  const items = navItems.filter(
    (item) =>
      ['home', 'courses', 'my-learning'].includes(item.id) ||
      (item.id === 'teaching' && (demoMode || role === 'teacher')),
  );
  return (
    <View style={styles.mobileNav}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.mobileNavButton}
          onPress={() => onNavigate(item.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: item.id === activePage }}
        >
          <Text
            style={[
              styles.mobileNavIcon,
              item.id === activePage && styles.mobileNavIconActive,
            ]}
          >
            {item.icon}
          </Text>
          <Text
            style={[
              styles.mobileNavLabel,
              item.id === activePage && styles.mobileNavLabelActive,
            ]}
          >
            {item.label === 'استكشف المواد'
              ? 'المواد'
              : item.label === 'لوحة المدرّس'
                ? 'التدريس'
                : item.label === 'تعلمي'
                  ? 'تعلّمي'
                  : item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#F2F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 14,
  },
  authLoadingText: {
    color: '#758279',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 380,
  },
  accountErrorTitle: {
    color: '#9C443A',
    fontSize: 18,
    fontWeight: '800',
  },
  app: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F8F5',
    direction: 'rtl',
    minHeight: '100%',
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: '100%',
    backgroundColor: '#F7F8F5',
  },
  sidebar: {
    width: 258,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#EAEEEA',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 8,
    marginBottom: 46,
  },
  brandMark: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#245A45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  brandName: { color: '#173D30', fontSize: 22, fontWeight: '800' },
  brandSub: { color: '#829088', fontSize: 11, marginTop: 1 },
  navCaption: {
    color: '#A0AAA3',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    marginBottom: 12,
    textAlign: 'right',
  },
  navList: { gap: 5 },
  navButton: {
    position: 'relative',
    minHeight: 47,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButtonActive: { backgroundColor: '#EDF4EF' },
  navIcon: {
    width: 24,
    textAlign: 'center',
    color: '#88938C',
    fontSize: 21,
  },
  navIconActive: { color: '#245A45' },
  navLabel: { color: '#64716A', fontSize: 13, fontWeight: '500' },
  navLabelActive: { color: '#245A45', fontWeight: '700' },
  activeMarker: {
    position: 'absolute',
    right: 0,
    top: 13,
    bottom: 13,
    width: 3,
    borderRadius: 3,
    backgroundColor: '#3F8061',
  },
  sidebarSpacer: { flex: 1, minHeight: 26 },
  helpCard: {
    borderRadius: 16,
    backgroundColor: '#F5F7F2',
    padding: 16,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  helpIcon: { color: '#C38C4E', fontSize: 20, marginBottom: 7 },
  helpTitle: { color: '#33493D', fontSize: 13, fontWeight: '700' },
  helpCopy: {
    color: '#87918B',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'right',
  },
  helpButton: {
    borderWidth: 1,
    borderColor: '#DDE4DC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 11,
  },
  helpButtonText: { color: '#3B604C', fontSize: 11, fontWeight: '700' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF0EC',
    paddingTop: 16,
    paddingHorizontal: 3,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#E9D7C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#77533E', fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { color: '#34463C', fontSize: 12, fontWeight: '700' },
  profileRole: { color: '#929B95', fontSize: 10, marginTop: 3 },
  profileMore: { color: '#89948D', fontSize: 18, letterSpacing: 1 },
  header: {
    height: 76,
    paddingHorizontal: 34,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEEEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breadcrumbText: { color: '#68766E', fontSize: 12, fontWeight: '600' },
  breadcrumbDivider: { color: '#C2CAC4', fontSize: 15 },
  breadcrumbCurrent: { color: '#A0A9A3', fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F7F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerActionIcon: { color: '#53665A', fontSize: 21 },
  notificationDot: {
    width: 7,
    height: 7,
    backgroundColor: '#C07857',
    borderRadius: 5,
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  headerDivider: { width: 1, height: 31, backgroundColor: '#E9EDE8' },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#E9D7C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#77533E', fontSize: 17, fontWeight: '700' },
  headerUserName: {
    color: '#33463B',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  headerUserLabel: {
    color: '#929B95',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },
  chevron: { color: '#8D9891', fontSize: 16, marginRight: 5 },
  content: {
    width: '100%',
    maxWidth: 1220,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 38,
    gap: 20,
  },
  wideContent: { paddingHorizontal: 42, paddingTop: 31, gap: 22 },
  pageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  eyebrow: {
    color: '#7D8A81',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 5,
  },
  pageTitle: {
    color: '#203B2D',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'right',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#EDF4EF',
  },
  onlineDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#528466' },
  roleText: { color: '#50705B', fontSize: 10, fontWeight: '700' },
  notice: {
    backgroundColor: '#EDF4EF',
    borderRadius: 11,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeText: { color: '#365846', fontSize: 12, textAlign: 'right', flex: 1 },
  noticeClose: { color: '#56735F', fontSize: 21, marginRight: 10 },
  hero: {
    minHeight: 245,
    borderRadius: 21,
    backgroundColor: '#214D3B',
    paddingVertical: 29,
    paddingHorizontal: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroCompact: { minHeight: 228, paddingHorizontal: 23, paddingVertical: 23 },
  heroCopy: { flex: 1, alignItems: 'flex-start', zIndex: 1 },
  heroLabel: {
    backgroundColor: '#FFFFFF1A',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 11,
    marginBottom: 14,
  },
  heroLabelText: { color: '#DBE9DD', fontSize: 10, fontWeight: '700' },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroDescription: {
    color: '#C5D8C9',
    fontSize: 12,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 17,
  },
  heroButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F2E5D4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroButtonText: { color: '#344F3D', fontSize: 11, fontWeight: '800' },
  heroButtonArrow: { color: '#55785E', fontSize: 15 },
  heroArt: {
    width: 230,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 18,
  },
  artCircleOuter: {
    width: 171,
    height: 171,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircleInner: {
    width: 133,
    height: 133,
    borderRadius: 70,
    backgroundColor: '#FFFFFF14',
    borderWidth: 1,
    borderColor: '#FFFFFF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artPlus: { color: '#EAD5B9', fontSize: 49, fontWeight: '400' },
  artLabel: { color: '#D2E2D4', fontSize: 11, marginTop: 2 },
  artSparkleOne: { position: 'absolute', top: 12, right: 25 },
  artSparkleTwo: { position: 'absolute', bottom: 14, left: 25 },
  artSparkle: { color: '#E7D4B5', fontSize: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 145,
    minHeight: 89,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFF1ED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { fontSize: 21, fontWeight: '700' },
  statTextWrap: { flex: 1, alignItems: 'flex-start' },
  statValue: { color: '#294536', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#89948D', fontSize: 10, marginTop: 4, textAlign: 'right' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#2D4135',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  sectionSubtitle: {
    color: '#929B95',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
    lineHeight: 17,
  },
  linkText: { color: '#527A5E', fontSize: 11, fontWeight: '700' },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  courseCard: {
    flex: 1,
    minWidth: 235,
    maxWidth: 420,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDF0EC',
  },
  courseArt: {
    height: 102,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  courseArtCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF86',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseArtIcon: { color: '#526B57', fontSize: 30, fontWeight: '700' },
  courseCategory: {
    position: 'absolute',
    top: 11,
    right: 11,
    borderRadius: 15,
    backgroundColor: '#FFFFFFC7',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  courseCategoryText: { color: '#596C5C', fontSize: 9, fontWeight: '700' },
  courseBody: { padding: 14 },
  courseTitle: {
    color: '#33483A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  courseInstructor: {
    color: '#89948C',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    marginBottom: 10,
  },
  courseMetaText: { color: '#8D9790', fontSize: 9 },
  courseMetaDot: { color: '#B7C0B8', fontSize: 10 },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 5,
    backgroundColor: '#EDF1EC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#528162',
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  courseFooterText: { color: '#4D7559', fontSize: 10, fontWeight: '700' },
  courseArrow: { color: '#78917C', fontSize: 15 },
  searchBox: {
    minHeight: 47,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchIcon: { color: '#708378', fontSize: 24, transform: [{ rotate: '-20deg' }] },
  searchInput: {
    flex: 1,
    color: '#405348',
    fontSize: 12,
    paddingVertical: 11,
    outlineStyle: 'none',
  },
  introCard: {
    backgroundColor: '#EAF1EA',
    borderRadius: 17,
    paddingVertical: 23,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  introTitle: {
    color: '#2E503B',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'right',
  },
  introCopy: {
    color: '#718177',
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: 7,
    maxWidth: 650,
  },
  categoryList: { gap: 8, paddingVertical: 2 },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#E1E7E1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: { backgroundColor: '#315D45', borderColor: '#315D45' },
  categoryChipText: { color: '#69786D', fontSize: 11, fontWeight: '600' },
  categoryChipTextActive: { color: '#FFFFFF' },
  resultsText: { color: '#89958D', fontSize: 11, textAlign: 'right' },
  emptyState: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF0EC',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: { color: '#3C5545', fontSize: 15, fontWeight: '800' },
  emptyCopy: {
    color: '#87928B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 380,
  },
  learningSummary: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF0EC',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  summaryNumber: { color: '#315E46', fontSize: 26, fontWeight: '800' },
  summaryCopy: { flex: 1, minWidth: 170 },
  summaryTitle: {
    color: '#3D5043',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryDescription: {
    color: '#8B968E',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  actionPanel: {
    padding: 18,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF0EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    flexWrap: 'wrap',
  },
  actionPanelCopy: { flex: 1, minWidth: 200 },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: '#315D45',
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  managementList: {
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF0EC',
    overflow: 'hidden',
  },
  managementRow: {
    minHeight: 75,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2EF',
  },
  managementIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EDF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementIconText: { color: '#4F765B', fontSize: 20 },
  managementCopy: { flex: 1 },
  managementTitle: {
    color: '#3B5142',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  managementDetail: {
    color: '#8E9891',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  managementArrow: { color: '#829087', fontSize: 17 },
  secureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: '#F1F3ED',
  },
  secureIcon: { color: '#59775F', fontSize: 17 },
  secureHintText: {
    flex: 1,
    color: '#758279',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'right',
  },
  mobileNav: {
    minHeight: 63,
    paddingHorizontal: 8,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: '#E8ECE7',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  mobileNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  mobileNavIcon: { color: '#95A098', fontSize: 20 },
  mobileNavIconActive: { color: '#315D45' },
  mobileNavLabel: { color: '#89948D', fontSize: 9 },
  mobileNavLabelActive: { color: '#315D45', fontWeight: '700' },
});

function roleLabel(role: UserRole) {
  if (role === 'teacher') return 'مدرّس';
  if (role === 'admin') return 'مشرف المنصة';
  return 'طالبة تمريض';
}

export default function App() {
  return (
    <AuthProvider>
      <Platform />
    </AuthProvider>
  );
}
