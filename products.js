// Du lieu san pham. Moi san pham co nhieu mau (giong Shopee).
// "hex" dung de hien thi o chon mau va sinh anh minh hoa.

export const categories = [
  { id: "do-bo-nam", name: "Đồ bộ nam" },
  { id: "do-bo-nu", name: "Đồ bộ nữ" },
  { id: "quan-dui-nu", name: "Quần đùi nữ" }
];

// Phi ship: mac dinh 30k, mien phi khi don >= 300k
export const shipping = { fee: 30000, freeThreshold: 300000 };

// Cac ma giam gia
export const discounts = [
  { code: "MUAHE10", type: "percent", value: 10, label: "Giảm 10% toàn đơn" },
  { code: "GIAM20K", type: "amount", value: 20000, label: "Giảm 20.000đ" },
  { code: "FREESHIP", type: "freeship", value: 0, label: "Miễn phí vận chuyển" }
];

// Tinh tien don hang (dung chung cho server va frontend).
// Tra ve: subtotal, shippingFee, discountAmount (so tien duoc giam), appliedCode, total
export function computeOrder(items, code) {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
    0
  );

  // Phi ship co ban (mien phi neu gio trong hoac dat moc mien phi)
  const shippingFee =
    subtotal === 0 || subtotal >= shipping.freeThreshold ? 0 : shipping.fee;

  let discountAmount = 0;
  let appliedCode = null;
  const d = code
    ? discounts.find((x) => x.code === String(code).trim().toUpperCase())
    : null;

  if (d) {
    appliedCode = d.code;
    if (d.type === "percent") {
      discountAmount = Math.round((subtotal * d.value) / 100);
    } else if (d.type === "amount") {
      discountAmount = Math.min(d.value, subtotal);
    } else if (d.type === "freeship") {
      // Mien phi ship: khoan giam dung bang phi ship hien tai
      discountAmount = shippingFee;
    }
  }

  // Tong = tien hang + phi ship - giam gia (giam khong vuot qua tien hang + ship)
  const total = Math.max(0, subtotal + shippingFee - discountAmount);
  return { subtotal, shippingFee, discountAmount, appliedCode, total };
}

// Anh review/banner cua shop (hien thi o khu "Review tu shop")
export const gallery = [
  { image: "images/banner-nu.png", caption: "Đồ bộ siêu mát cho ngày hè" },
  { image: "images/review-nam-mat-cuoi.png", caption: "Review thực tế — Bộ mặt cười" },
  { image: "images/review-nam-pho.png", caption: "Review thực tế — Khách hàng" }
];

// Gia theo phan loai
const GIA = { nu: 159000, nam: 189000, quan: 50000 };

const SIZE_NU = ["M (45-55kg)", "L (55-65kg)", "XL (65-75kg)"];
const SIZE_NAM = ["M", "L", "XL", "XXL"];
const SIZE_QUAN = ["M", "L", "XL"];

export const products = [
  // ----- ĐỒ BỘ NỮ (159k) — bộ sát nách bèo, vải tole lạnh -----
  {
    id: "nu-shinchan",
    name: "Đồ Bộ Nữ Sát Nách - Shin Sọc",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Bộ sát nách dáng bèo nữ tính, họa tiết Shin sọc dễ thương. Vải tole lạnh mềm mát, thấm hút mồ hôi.",
    sizes: SIZE_NU,
    image: "images/nu-shinchan.png"
  },
  {
    id: "nu-gau-heo",
    name: "Đồ Bộ Nữ Sát Nách - Gấu Heo",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Họa tiết gấu heo vàng pastel cực yêu, áo bèo eo. Chất tole nhẹ tênh, mặc nhà hay đi chơi đều xinh.",
    sizes: SIZE_NU,
    image: "images/nu-gau-heo.png"
  },
  {
    id: "nu-hoa-nhi",
    name: "Đồ Bộ Nữ Sát Nách - Hoa Nhí",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Họa tiết hoa nhí nhiều màu trên nền kem, tươi tắn và nữ tính. Vải tole thoáng khí, dịu mát.",
    sizes: SIZE_NU,
    image: "images/nu-hoa-nhi.png"
  },
  {
    id: "nu-patrick",
    name: "Đồ Bộ Nữ Sát Nách - Sao Hồng",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Họa tiết sao biển hồng ngộ nghĩnh, tông pastel dễ thương. Dáng bèo trẻ trung, mát mẻ.",
    sizes: SIZE_NU,
    image: "images/nu-patrick.png"
  },
  {
    id: "nu-spongebob",
    name: "Đồ Bộ Nữ Sát Nách - Bọt Biển",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Họa tiết hoạt hình vui nhộn trên nền kem. Vải tole cao cấp, mềm mại, thấm hút tốt.",
    sizes: SIZE_NU,
    image: "images/nu-spongebob.png"
  },
  {
    id: "nu-hoa-nhieu-mau",
    name: "Đồ Bộ Nữ Sát Nách - Hoa Rực Rỡ",
    category: "do-bo-nu",
    price: GIA.nu,
    desc: "Hoa nhiều màu rực rỡ trên nền kem, nổi bật và tươi mát. Áo bèo nữ tính, dễ phối.",
    sizes: SIZE_NU,
    image: "images/nu-hoa-nhieu-mau.png"
  },

  // ----- ĐỒ BỘ NAM (189k) — bộ tay ngắn, vải tole cao cấp -----
  {
    id: "nam-mat-cuoi",
    name: "Đồ Bộ Nam Tay Ngắn - Mặt Cười",
    category: "do-bo-nam",
    price: GIA.nam,
    desc: "Bộ tay ngắn + quần đùi, họa tiết mặt cười xám trẻ trung. Form rộng rãi, cổ tròn cài nút, có túi áo tiện lợi.",
    sizes: SIZE_NAM,
    image: "images/nam-mat-cuoi.png"
  },
  {
    id: "nam-khung-long",
    name: "Đồ Bộ Nam Tay Ngắn - Khủng Long",
    category: "do-bo-nam",
    price: GIA.nam,
    desc: "Họa tiết khủng long năng động trên nền xanh mát. Vải tole cao cấp, thoáng khí, thấm hút mồ hôi tốt.",
    sizes: SIZE_NAM,
    image: "images/nam-khung-long.png"
  },
  {
    id: "nam-oto",
    name: "Đồ Bộ Nam Tay Ngắn - Ô Tô",
    category: "do-bo-nam",
    price: GIA.nam,
    desc: "Họa tiết ô tô & icon vui mắt, tông xanh lá tươi sáng. Quần lưng thun co giãn, mặc cả ngày dễ chịu.",
    sizes: SIZE_NAM,
    image: "images/nam-oto.png"
  },
  {
    id: "nam-ca-voi",
    name: "Đồ Bộ Nam Tay Ngắn - Cá Voi",
    category: "do-bo-nam",
    price: GIA.nam,
    desc: "Họa tiết cá voi đại dương dễ thương trên nền xanh xám, tươi mát. Vải tole cao cấp, mềm mại, thấm hút tốt.",
    sizes: SIZE_NAM,
    image: "images/nam-ca-voi.png"
  },

  // ----- QUẦN ĐÙI NỮ (50k) — chọn màu kiểu Shopee -----
  {
    id: "quan-dui-sieu-mat",
    name: "Quần Đùi Siêu Mát",
    category: "quan-dui-nu",
    price: GIA.quan,
    desc: "Quần đùi tole lạnh cho ngày hè, lưng thun co giãn, mềm mại - thoáng khí - thấm hút tốt. Nhiều màu xinh để chọn.",
    sizes: SIZE_QUAN,
    image: "images/quan-nhom.png",
    variants: [
      { name: "Xanh mint - Gấu", image: "images/quan-mint-gau.png" },
      { name: "Vàng - Cầu vồng tulip", image: "images/quan-cau-vong.png" },
      { name: "Xanh lá - Cún con", image: "images/quan-cun-xanh.png" },
      { name: "Trắng - Hoa nhí", image: "images/quan-hoa-trang.png" }
    ]
  }
];
