const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'store', '[slug]', 'page.tsx');
let c = fs.readFileSync(filePath, 'utf-8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';

let changes = 0;

// ============================
// FIX 1: Mobile layout bug — flex should be flex-col on mobile
// ============================
const oldFlex = '      {/* Main layout: sidebar + content */}' + nl + '      <div className="flex gap-6">';
const newFlex = '      {/* Main layout: sidebar + content */}' + nl + '      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">';
if (c.includes(oldFlex)) {
  c = c.replace(oldFlex, newFlex);
  changes++;
  console.log('1. Fixed flex layout for mobile (flex-col → lg:flex-row)');
} else {
  console.log('1. SKIP — flex layout already fixed or not found');
}

// ============================
// FIX 2: Remove Banner Slider from page — keep only Stories
// ============================
const bannerSliderBlock = [
  '',
  '      {/* Banner Slider */}',
  '      {banners && banners.filter((b: any) => b.banner_type !== "story").length > 0 && (',
  '        <BannerSlider banners={banners.filter((b: any) => b.banner_type !== "story")} primaryColor={primaryColor} />',
  '      )}',
].join(nl);

if (c.includes(bannerSliderBlock)) {
  c = c.replace(bannerSliderBlock, '');
  changes++;
  console.log('2. Removed Banner Slider from page');
} else {
  console.log('2. SKIP — Banner Slider block not found');
}

// ============================
// FIX 3: Update StoriesRow — square on desktop, circle on mobile
// ============================
const oldStoriesCircle = [
  '      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">',
  '        {stories.map((story: any, i: number) => (',
  '          <button',
  '            key={story.id}',
  '            onClick={() => setActiveStory(i)}',
  '            className="shrink-0 flex flex-col items-center gap-1.5 group"',
  '          >',
  '            <div',
  '              className="p-[3px] rounded-full"',
  '              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88, ${primaryColor}44)` }}',
  '            >',
  '              <div className="p-[2px] rounded-full bg-white">',
  '                <img',
  '                  src={story.image_url}',
  '                  alt={story.title || "Story"}',
  '                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover group-hover:scale-105 transition-transform"',
  '                />',
  '              </div>',
  '            </div>',
  '            {story.title && (',
  '              <span className="text-[11px] font-medium s-text text-center line-clamp-1 max-w-[72px] sm:max-w-[80px]">',
  '                {story.title}',
  '              </span>',
  '            )}',
  '          </button>',
  '        ))}',
  '      </div>',
].join(nl);

const newStoriesCircle = [
  '      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-thin px-0.5">',
  '        {stories.map((story: any, i: number) => (',
  '          <button',
  '            key={story.id}',
  '            onClick={() => setActiveStory(i)}',
  '            className="shrink-0 flex flex-col items-center gap-1.5 group"',
  '          >',
  '            {/* Mobile: circle / Desktop: rounded square */}',
  '            <div',
  '              className="p-[3px] rounded-full lg:rounded-2xl"',
  '              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88, ${primaryColor}44)` }}',
  '            >',
  '              <div className="p-[2px] rounded-full lg:rounded-[13px] bg-white">',
  '                <img',
  '                  src={story.image_url}',
  '                  alt={story.title || "Story"}',
  '                  className="h-16 w-16 sm:h-[72px] sm:w-[72px] lg:h-24 lg:w-24 rounded-full lg:rounded-xl object-cover group-hover:scale-105 transition-transform duration-200"',
  '                />',
  '              </div>',
  '            </div>',
  '            {story.title && (',
  '              <span className="text-[10px] sm:text-[11px] font-medium s-text text-center line-clamp-1 max-w-[68px] sm:max-w-[76px] lg:max-w-[96px]">',
  '                {story.title}',
  '              </span>',
  '            )}',
  '          </button>',
  '        ))}',
  '      </div>',
].join(nl);

if (c.includes(oldStoriesCircle)) {
  c = c.replace(oldStoriesCircle, newStoriesCircle);
  changes++;
  console.log('3. Updated Stories: circle→mobile, square→desktop');
} else {
  console.log('3. SKIP — Stories circle block not found');
}

// ============================
// FIX 4: Improve product grid spacing for mobile
// ============================
const oldGridGap = `                "gap-4",`;
const newGridGap = `                "gap-3 sm:gap-4",`;
if (c.includes(oldGridGap)) {
  c = c.replace(oldGridGap, newGridGap);
  changes++;
  console.log('4. Reduced grid gap on mobile (gap-3 → sm:gap-4)');
} else {
  console.log('4. SKIP — grid gap already fixed');
}

// ============================
// FIX 5: Make space-y-6 smaller on mobile
// ============================
const oldSpaceY = '    <div className="space-y-6">';
const newSpaceY = '    <div className="space-y-4 sm:space-y-6">';
if (c.includes(oldSpaceY)) {
  c = c.replace(oldSpaceY, newSpaceY);
  changes++;
  console.log('5. Reduced spacing on mobile (space-y-4 → sm:space-y-6)');
} else {
  console.log('5. SKIP — space-y already updated');
}

// ============================
// FIX 6: Fix category chips padding for mobile
// ============================
const oldChipPad = '              "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",';
if (c.includes(oldChipPad)) {
  c = c.replaceAll(oldChipPad, '              "shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",');
  changes++;
  console.log('6. Made category chips smaller on mobile');
} else {
  console.log('6. SKIP — chip padding not found');
}

// ============================
// FIX 7: Remove BannerSlider function entirely
// ============================
const bannerFnStart = '/* ─── Banner Slider ─── */';
const bannerFnEnd = '  );' + nl + '}' + nl + nl;
const bannerStartIdx = c.indexOf(bannerFnStart);
if (bannerStartIdx !== -1) {
  // Find the closing of BannerSlider function
  let searchFrom = bannerStartIdx;
  // We need to find the function end - look for 'function QuickViewModal'
  const nextFn = c.indexOf('function QuickViewModal(', searchFrom);
  if (nextFn !== -1) {
    c = c.substring(0, bannerStartIdx) + c.substring(nextFn);
    changes++;
    console.log('7. Removed BannerSlider function');
  } else {
    console.log('7. SKIP — Could not find QuickViewModal after BannerSlider');
  }
} else {
  console.log('7. SKIP — BannerSlider function not found');
}

// ============================
// FIX 8: Improve "Show more" button for mobile
// ============================
const oldShowMore = '                    variant="outline"' + nl + '                    className="rounded-xl px-8 h-11 shadow-sm"';
const newShowMore = '                    variant="outline"' + nl + '                    className="rounded-xl px-6 sm:px-8 h-10 sm:h-11 shadow-sm text-sm"';
if (c.includes(oldShowMore)) {
  c = c.replace(oldShowMore, newShowMore);
  changes++;
  console.log('8. Made "Show more" button smaller on mobile');
} else {
  console.log('8. SKIP — Show more button not found');
}

// ============================
// FIX 9: Improve recently viewed section for mobile
// ============================
const oldRecent = `<h2 className="text-lg font-bold s-text">Недавно просмотренные</h2>`;
const newRecent = `<h2 className="text-base sm:text-lg font-bold s-text">Недавно просмотренные</h2>`;
if (c.includes(oldRecent)) {
  c = c.replace(oldRecent, newRecent);
  changes++;
  console.log('9. Made "Recently viewed" header responsive');
} else {
  console.log('9. SKIP — recent-viewed header not found');
}

fs.writeFileSync(filePath, c);
console.log(`\nTotal: ${changes} changes applied`);
