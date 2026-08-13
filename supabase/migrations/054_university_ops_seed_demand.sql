-- =============================================================================
-- MIGRATION 054 — Seed first operational universities (demand-based)
-- Safe to re-run: uses fixed UUIDs + ON CONFLICT / existence checks.
-- Focus: Chinese language, Bachelor Business/CS/Engineering, scholarships,
-- affordable cities, September 2026 / 2027 intakes for ~82-student pipeline.
-- Does NOT import the full public catalog.
-- =============================================================================

-- Helper: insert university if missing by slug
-- Fixed UUIDs for stable mapping

insert into public.ops_universities (
  id, name, chinese_name, short_name, slug, city, province, country,
  university_type, website, record_source, public_catalog_slug, description, internal_notes
)
values
  ('a1000001-0001-4000-8000-000000000001', 'Henan University', '河南大学', 'HENU', 'henan-university', 'Kaifeng', 'Henan', 'China', 'Regular', 'https://www.henu.edu.cn', 'manual', 'henan-university', 'Affordable Chinese language + degree options common for Moroccan pipeline.', 'Demand: Chinese language, affordable cities'),
  ('a1000001-0001-4000-8000-000000000002', 'Zhengzhou University', '郑州大学', 'ZZU', 'zhengzhou-university', 'Zhengzhou', 'Henan', 'China', '211', 'https://www.zzu.edu.cn', 'manual', 'zhengzhou-university', 'Large provincial university; language + engineering demand.', 'Demand: Engineering, language'),
  ('a1000001-0001-4000-8000-000000000003', 'Jiangnan University', '江南大学', 'JNU', 'jiangnan-university', 'Wuxi', 'Jiangsu', 'China', '211', 'https://www.jiangnan.edu.cn', 'manual', 'jiangnan-university', 'Business / design / language interest.', 'Demand: Business'),
  ('a1000001-0001-4000-8000-000000000004', 'Soochow University', '苏州大学', 'SUDA', 'soochow-university', 'Suzhou', 'Jiangsu', 'China', '211', 'https://www.suda.edu.cn', 'manual', 'soochow-university', 'Business and language programs.', 'Demand: Business, language'),
  ('a1000001-0001-4000-8000-000000000005', 'Nanjing Normal University', '南京师范大学', 'NNU', 'nanjing-normal-university', 'Nanjing', 'Jiangsu', 'China', '211', 'https://www.njnu.edu.cn', 'manual', 'nanjing-normal-university', 'Strong Chinese language pathway.', 'Demand: Chinese language'),
  ('a1000001-0001-4000-8000-000000000006', 'Beijing Language and Culture University', '北京语言大学', 'BLCU', 'beijing-language-and-culture-university', 'Beijing', 'Beijing', 'China', 'Regular', 'https://www.blcu.edu.cn', 'manual', 'beijing-language-and-culture-university', 'Primary Chinese language destination.', 'Demand: Chinese language'),
  ('a1000001-0001-4000-8000-000000000007', 'Shanghai University', '上海大学', 'SHU', 'shanghai-university', 'Shanghai', 'Shanghai', 'China', '211', 'https://www.shu.edu.cn', 'manual', 'shanghai-university', 'Business / CS interest in coastal cities.', 'Demand: Business, CS'),
  ('a1000001-0001-4000-8000-000000000008', 'Donghua University', '东华大学', 'DHU', 'donghua-university', 'Shanghai', 'Shanghai', 'China', '211', 'https://www.dhu.edu.cn', 'manual', 'donghua-university', 'Business and design adjacent majors.', 'Demand: Business'),
  ('a1000001-0001-4000-8000-000000000009', 'University of International Business and Economics', '对外经济贸易大学', 'UIBE', 'university-of-international-business-and-economics', 'Beijing', 'Beijing', 'China', '211', 'https://www.uibe.edu.cn', 'manual', 'university-of-international-business-and-economics', 'Business / trade majors.', 'Demand: Business'),
  ('a1000001-0001-4000-8000-00000000000a', 'Beijing University of Technology', '北京工业大学', 'BJUT', 'beijing-university-of-technology', 'Beijing', 'Beijing', 'China', '211', 'https://www.bjut.edu.cn', 'manual', 'beijing-university-of-technology', 'Engineering / CS.', 'Demand: Engineering, CS'),
  ('a1000001-0001-4000-8000-00000000000b', 'China Agricultural University', '中国农业大学', 'CAU', 'china-agricultural-university', 'Beijing', 'Beijing', 'China', '985', 'https://www.cau.edu.cn', 'manual', 'china-agricultural-university', 'Often in pipeline seed list.', 'Demand: pipeline seed overlap'),
  ('a1000001-0001-4000-8000-00000000000c', 'Wuhan University', '武汉大学', 'WHU', 'wuhan-university', 'Wuhan', 'Hubei', 'China', '985', 'https://www.whu.edu.cn', 'manual', 'wuhan-university', 'Central China; broad majors.', 'Demand: Bachelor general'),
  ('a1000001-0001-4000-8000-00000000000d', 'Huazhong University of Science and Technology', '华中科技大学', 'HUST', 'huazhong-university-of-science-and-technology', 'Wuhan', 'Hubei', 'China', '985', 'https://www.hust.edu.cn', 'manual', 'huazhong-university-of-science-and-technology', 'Engineering / CS strength.', 'Demand: Engineering, CS'),
  ('a1000001-0001-4000-8000-00000000000e', 'Central South University', '中南大学', 'CSU', 'central-south-university', 'Changsha', 'Hunan', 'China', '985', 'https://www.csu.edu.cn', 'manual', 'central-south-university', 'Engineering demand; more affordable inland.', 'Demand: Engineering'),
  ('a1000001-0001-4000-8000-00000000000f', 'Hunan University', '湖南大学', 'HNU', 'hunan-university', 'Changsha', 'Hunan', 'China', '985', 'https://www.hnu.edu.cn', 'manual', 'hunan-university', 'Business / engineering.', 'Demand: Business, Engineering'),
  ('a1000001-0001-4000-8000-000000000010', 'Xiamen University', '厦门大学', 'XMU', 'xiamen-university', 'Xiamen', 'Fujian', 'China', '985', 'https://www.xmu.edu.cn', 'manual', 'xiamen-university', 'Coastal; business / language.', 'Demand: Business, language'),
  ('a1000001-0001-4000-8000-000000000011', 'Fuzhou University', '福州大学', 'FZU', 'fuzhou-university', 'Fuzhou', 'Fujian', 'China', '211', 'https://www.fzu.edu.cn', 'manual', 'fuzhou-university', 'Affordable coastal option.', 'Demand: affordable cities'),
  ('a1000001-0001-4000-8000-000000000012', 'Nanchang University', '南昌大学', 'NCU', 'nanchang-university', 'Nanchang', 'Jiangxi', 'China', '211', 'https://www.ncu.edu.cn', 'manual', 'nanchang-university', 'Affordable inland.', 'Demand: affordable cities'),
  ('a1000001-0001-4000-8000-000000000013', 'Anhui University', '安徽大学', 'AHU', 'anhui-university', 'Hefei', 'Anhui', 'China', '211', 'https://www.ahu.edu.cn', 'manual', 'anhui-university', 'Affordable; language + bachelor.', 'Demand: affordable cities'),
  ('a1000001-0001-4000-8000-000000000014', 'Hefei University of Technology', '合肥工业大学', 'HFUT', 'hefei-university-of-technology', 'Hefei', 'Anhui', 'China', '211', 'https://www.hfut.edu.cn', 'manual', 'hefei-university-of-technology', 'Engineering focus.', 'Demand: Engineering'),
  ('a1000001-0001-4000-8000-000000000015', 'Chongqing University', '重庆大学', 'CQU', 'chongqing-university', 'Chongqing', 'Chongqing', 'China', '985', 'https://www.cqu.edu.cn', 'manual', 'chongqing-university', 'Southwest; engineering / business.', 'Demand: Engineering, Business'),
  ('a1000001-0001-4000-8000-000000000016', 'Southwest University', '西南大学', 'SWU', 'southwest-university', 'Chongqing', 'Chongqing', 'China', '211', 'https://www.swu.edu.cn', 'manual', 'southwest-university', 'Language + bachelor affordable.', 'Demand: Chinese language'),
  ('a1000001-0001-4000-8000-000000000017', 'Sichuan University', '四川大学', 'SCU', 'sichuan-university', 'Chengdu', 'Sichuan', 'China', '985', 'https://www.scu.edu.cn', 'manual', 'sichuan-university', 'Chengdu demand; broad majors.', 'Demand: Bachelor general'),
  ('a1000001-0001-4000-8000-000000000018', 'University of Electronic Science and Technology of China', '电子科技大学', 'UESTC', 'university-of-electronic-science-and-technology-of-china', 'Chengdu', 'Sichuan', 'China', '985', 'https://www.uestc.edu.cn', 'manual', 'university-of-electronic-science-and-technology-of-china', 'CS / telecom.', 'Demand: Computer Science'),
  ('a1000001-0001-4000-8000-000000000019', 'Zhejiang University of Finance and Economics', '浙江财经大学', 'ZUFE', 'zhejiang-university-of-finance-and-economics', 'Hangzhou', 'Zhejiang', 'China', 'Regular', 'https://www.zufe.edu.cn', 'manual', 'zhejiang-university-of-finance-and-economics', 'Existing partner portal seed (ZUFE).', 'Demand: Business; partner portal overlap')
on conflict (id) do nothing;

-- Partnerships (research → active where known partner overlap)
insert into public.ops_partnerships (university_id, status, notes)
select id, 'research', 'Seeded for 2026 pipeline demand curation'
from public.ops_universities
where id::text like 'a1000001-0001-4000-8000-%'
  and not exists (
    select 1 from public.ops_partnerships p where p.university_id = ops_universities.id
  );

update public.ops_partnerships
set status = 'partner',
    notes = 'Linked to existing partner portal interest (ZUFE seed)'
where university_id = 'a1000001-0001-4000-8000-000000000019';

-- Map existing partner_universities / pipeline_universities by name where possible
update public.partner_universities pu
set ops_university_id = ou.id
from public.ops_universities ou
where pu.ops_university_id is null
  and lower(pu.name) = lower(ou.name);

update public.pipeline_universities pl
set ops_university_id = ou.id
from public.ops_universities ou
where pl.ops_university_id is null
  and lower(pl.name) = lower(ou.name);

-- Programs: Chinese Language + Business + CS + Engineering where relevant
insert into public.ops_programs (
  id, university_id, name, degree_type, teaching_language, major_category, duration,
  tuition_guide, currency, info_source, active
)
values
  -- Language programs (high demand)
  ('b1000001-0001-4000-8000-000000000001', 'a1000001-0001-4000-8000-000000000001', 'Chinese Language Program', 'Language', 'Chinese', 'Chinese Language', '1 year', 10000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000002', 'a1000001-0001-4000-8000-000000000002', 'Chinese Language Program', 'Language', 'Chinese', 'Chinese Language', '1 year', 12000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000003', 'a1000001-0001-4000-8000-000000000005', 'Chinese Language Program', 'Language', 'Chinese', 'Chinese Language', '1 year', 14000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000004', 'a1000001-0001-4000-8000-000000000006', 'Chinese Language Program', 'Language', 'Chinese', 'Chinese Language', '1 year', 23000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000005', 'a1000001-0001-4000-8000-000000000016', 'Chinese Language Program', 'Language', 'Chinese', 'Chinese Language', '1 year', 11000, 'CNY', 'Seed placeholder — verify with university', true),
  -- Business
  ('b1000001-0001-4000-8000-000000000006', 'a1000001-0001-4000-8000-000000000003', 'Business Administration', 'Bachelor', 'English', 'Business', '4 years', 18000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000007', 'a1000001-0001-4000-8000-000000000004', 'International Business', 'Bachelor', 'English', 'Business', '4 years', 18000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000008', 'a1000001-0001-4000-8000-000000000009', 'International Economics and Trade', 'Bachelor', 'English', 'Business', '4 years', 24980, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-000000000009', 'a1000001-0001-4000-8000-000000000019', 'Business Administration', 'Bachelor', 'English', 'Business', '4 years', 18000, 'CNY', 'Seed placeholder — verify with university', true),
  -- CS / Engineering
  ('b1000001-0001-4000-8000-00000000000a', 'a1000001-0001-4000-8000-00000000000a', 'Computer Science and Technology', 'Bachelor', 'English', 'Computer Science', '4 years', 30000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-00000000000b', 'a1000001-0001-4000-8000-00000000000d', 'Computer Science and Technology', 'Bachelor', 'English', 'Computer Science', '4 years', 30000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-00000000000c', 'a1000001-0001-4000-8000-000000000018', 'Computer Science and Technology', 'Bachelor', 'English', 'Computer Science', '4 years', 25000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-00000000000d', 'a1000001-0001-4000-8000-00000000000e', 'Civil Engineering', 'Bachelor', 'English', 'Engineering', '4 years', 20000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-00000000000e', 'a1000001-0001-4000-8000-000000000014', 'Mechanical Engineering', 'Bachelor', 'English', 'Engineering', '4 years', 18000, 'CNY', 'Seed placeholder — verify with university', true),
  ('b1000001-0001-4000-8000-00000000000f', 'a1000001-0001-4000-8000-000000000015', 'Civil Engineering', 'Bachelor', 'English', 'Engineering', '4 years', 20000, 'CNY', 'Seed placeholder — verify with university', true)
on conflict (id) do nothing;

-- Offers for Sep 2026 (potential/verifying — must be verified before matching as Active)
insert into public.ops_offers (
  id, program_id, university_id, intake, academic_year, tuition, currency,
  scholarship_type, scholarship_notes, deadline, status, info_source, internal_notes
)
select
  gen_random_uuid(),
  p.id,
  p.university_id,
  '2026-09',
  '2026-2027',
  p.tuition_guide,
  'CNY',
  case when p.tuition_guide is not null and p.tuition_guide <= 14000 then 'University scholarship'
       else null end,
  case when p.tuition_guide is not null and p.tuition_guide <= 14000 then 'Confirm coverage with IO'
       else null end,
  '2026-06-30',
  'verifying',
  'Seed placeholder — verify before marking Active',
  'Created for Sep 2026 pipeline matching; do not treat as verified operational truth yet'
from public.ops_programs p
where p.id::text like 'b1000001-0001-4000-8000-%'
  and not exists (
    select 1 from public.ops_offers o
    where o.program_id = p.id and o.intake = '2026-09'
  );

-- Sep 2027 historical/future row for language programs (separate intake — does not overwrite 2026)
insert into public.ops_offers (
  id, program_id, university_id, intake, academic_year, tuition, currency,
  status, info_source, internal_notes
)
select
  gen_random_uuid(),
  p.id,
  p.university_id,
  '2027-09',
  '2027-2028',
  p.tuition_guide,
  'CNY',
  'potential',
  'Seed placeholder — early research for 2027',
  'Separate historical intake row from 2026-09'
from public.ops_programs p
where p.degree_type = 'Language'
  and p.id::text like 'b1000001-0001-4000-8000-%'
  and not exists (
    select 1 from public.ops_offers o
    where o.program_id = p.id and o.intake = '2027-09'
  );

comment on table public.ops_universities is
  'Canonical Sallam university identity. Seed 054 = demand-based first 25 for 2026 pipeline.';
