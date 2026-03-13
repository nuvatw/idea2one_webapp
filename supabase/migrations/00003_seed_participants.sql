-- ===========================================
-- Seed Data: Participants（法法）
-- 新增 phone、dietary_note 欄位 + 匯入 63 位學員資料
-- ===========================================

-- 新增欄位
ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS dietary_note TEXT;

-- 清除舊資料（依 FK 順序：先刪依賴表再刪主表）
DELETE FROM ai_logs;
DELETE FROM lunch_logs;
DELETE FROM attendance_logs;
DELETE FROM answers;
DELETE FROM questions;
DELETE FROM participants;

-- ===========================================
-- 匯入法法資料（001–063）
-- diet_type: 葷 / 素（蛋奶素歸為素）
-- dietary_note: 額外飲食備註
-- ===========================================

INSERT INTO participants (participant_code, name, email, phone, diet_type, dietary_note) VALUES
  ('001', '楊婷雅',     'hi@knowledgegut.com',              '0986456898', '葷', '不吃海鮮'),
  ('002', '蕭伊涵',     'hanibetter888@gmail.com',           '0983184616', '葷', '不吃牛'),
  ('003', '邱品瑄',     'cococho20042004@gmail.com',         '0979326908', '葷', NULL),
  ('004', '鄭典',       'a0925610998@gmail.com',             '0963551869', '葷', NULL),
  ('005', '王品絜',     'tiffanywang4912@gmail.com',         '0975721288', '葷', NULL),
  ('006', 'Suzy Chao', 'suzychao@gmail.com',                '0939274841', '葷', NULL),
  ('007', '黃湘吟',     'yukicb04536@gmail.com',             '0901161209', '葷', '不吃青蔥'),
  ('008', '湯惠心',     'huixintang963@gmail.com',           '0905205767', '葷', NULL),
  ('009', '李宜蓁',     'mina1212oao@gmail.com',             '0937078446', '葷', NULL),
  ('010', 'Adelyn',    'lynnnnnn028@gmail.com',              '0975638125', '葷', NULL),
  ('011', '劉冠呈',     'lawrencelin30@gmail.com',           '0915506860', '葷', NULL),
  ('012', '林子菁',     'tzjing222@gmail.com',               '0966537889', '葷', NULL),
  ('013', '蔡秉軒',     'alfietsai701@gmail.com',            '0972396129', '葷', NULL),
  ('014', '蔡卉蓁',     'lppmilk@gmail.com',                 '0955292132', '葷', '不吃青椒'),
  ('015', '譚雅',       'raun61027@gmail.com',               '0988575427', '葷', '不吃牛'),
  ('016', '葉千輔',     's411379089@gm.ntpu.edu.tw',         '0978479516', '葷', NULL),
  ('017', '林映辰',     'elaine19931120@gmail.com',           '0956569818', '葷', NULL),
  ('018', '蘇榆庭',     'melodysuqq@gmail.com',              '0968763537', '葷', NULL),
  ('019', '劉桂坊',     'b06801023@gmail.com',               '0981815516', '葷', '不辣'),
  ('020', '陳姵彣',     'cpw951101@gmail.com',               '0966314359', '葷', '不吃牛'),
  ('021', '徐昀瑩',     'es.winwin@gmail.com',               '0966146991', '葷', NULL),
  ('022', '鄭文晶',     'b0937498280@gmail.com',             '0937498280', '葷', NULL),
  ('023', '王思頤',     '541wjkl@gmail.com',                 '0919706866', '葷', NULL),
  ('024', '葉珊杉',     'susanthree0719@gmail.com',          '0911488078', '葷', NULL),
  ('025', '施岳辰',     '0129vitas0129@gmail.com',           '0961519937', '葷', NULL),
  ('026', '蔡妙青',     'katherineching318@gmail.com',       '0916795657', '葷', '不吃牛'),
  ('027', '蔡佳倩',     'chiachien1201@gmail.com',           '0900007634', '葷', NULL),
  ('028', '徐恆信',     'shupaul781128781128@gmail.com',     '0952406048', '葷', NULL),
  ('029', '談亞倫',     'allen962007@gmail.com',             '0908006818', '葷', NULL),
  ('030', '林鈺婷',     'yukishine520@gmail.com',            '0900165568', '葷', NULL),
  ('031', '廖蒼藝',     'lty91723@gmail.com',                '0968080310', '葷', NULL),
  ('032', '鄭雅勻',     'amy930924@gmail.com',               '0905122593', '葷', NULL),
  ('033', '吳嘉翔',     'rocky921201.123@gmail.com',         '0977618022', '葷', NULL),
  ('034', '蔡宗恩',     'tsaizongen330@gmail.com',           '0901353026', '葷', '不吃牛、海鮮'),
  ('035', '謝佳吟',     'ttcps1013675219@gmail.com',         '0980023337', '素', '蛋奶素'),
  ('036', '牟少瑄',     'hsuan.mou.0725@gmail.com',          '0938757206', '葷', NULL),
  ('037', '王鈺晴',     'ching901105@gmail.com',             '0965339650', '葷', '蠶豆症'),
  ('038', '陳品縈',     'pinying.same@gmail.com',            '0905710392', '葷', '不吃牛羊'),
  ('039', '陳宇宸',     'anguschen10830@gmail.com',          '0935673608', '葷', '不吃牛'),
  ('040', '黃建霖',     'joe880402@gmail.com',               '0973993519', '葷', NULL),
  ('041', '張鳳書',     '1358001csmu@gmail.com',             '0902108663', '素', '蛋奶素'),
  ('042', '許瑋庭',     'jason20040520@gmail.com',           '0983360688', '葷', NULL),
  ('043', '古鑠汶',     'qrabbitedward@gmail.com',           '0987620869', '葷', NULL),
  ('044', '陳安琪',     'anqi831@gmail.com',                 '0937150132', '葷', NULL),
  ('045', '游承遠',     'a092468579@gmail.com',              '0918877155', '葷', '不吃A菜、大陸妹'),
  ('046', '袁宇成',     'luke180horse@gmail.com',            '0906300007', '葷', NULL),
  ('047', '黃筱嵐',     'mini19980709@gmail.com',            '0970673971', '葷', NULL),
  ('048', '林佳萱',     'sherry940303@gmail.com',            '0911608508', '葷', NULL),
  ('049', '朱柏丞',     'frodochu1229@gmail.com',            '0935651229', '葷', NULL),
  ('050', '張庭瑄',     'tsyuan.622@gmail.com',              '0905153113', '葷', NULL),
  ('051', '蔡愷霖',     'r1253400@gmail.com',                '0966151204', '葷', '不辣'),
  ('052', '蔡秉凱',     'tonycai0510@gmail.com',             '0905368391', '葷', NULL),
  ('053', '陳怡潔',     '41207215e@gapps.ntnu.edu.tw',       '0908590701', '葷', NULL),
  ('054', '李昕倫',     's1123513@mail.yzu.edu.tw',          '0976969693', '葷', NULL),
  ('055', '顏靖衡',     'o02325300@gmail.com',               '0989811452', '葷', NULL),
  ('056', '王舶宇',     'bertramwang99@gmail.com',           '0936543988', '葷', NULL),
  ('057', '江玟伶',     'giraffemichelle0313@gmail.com',     '0976562201', '葷', NULL),
  ('058', '陳冠樺',     'machirp111@gmail.com',              '0928839326', '葷', NULL),
  ('059', '翁語欣',     'wenghsin2325@gmail.com',            '0910259258', '葷', NULL),
  ('060', '陳佳安',     'chiaanc633@gmail.com',              '0983350140', '葷', NULL),
  ('061', '王予閎',     'yeah17h@gmail.com',                 '0920659852', '葷', NULL),
  ('062', '呂允仁',     'williamlu16888@gmail.com',          '0903336960', '葷', NULL),
  ('063', '吳伊晴',     'd.y.sgr931210@gmail.com',           '0933375682', '葷', NULL);
