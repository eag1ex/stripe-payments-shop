var items_data = [
  {
    itemId: "piano",
    desc:
      "<strong>Play by ear.</strong> Ever wish you could just hear a song and then play it for your friends? This 20-lecture course shows you how to take what you hear and play it on the piano.",
    price: 2500,
    title: "Mock Piano",
    img: "./assets/img/geert-pieters-8QrPJ3Kfie4-unsplash.jpg",
  },
  {
    itemId: "guitar",
    desc:
      "<strong>Intro to Rockabilly.</strong> Early rock and roll songs are a fun way to get an introduction to the guitar. By the end of this 15-lecture course you'll be wowing your friends.",
    price: 1500,
    title: "Mock Guitar",
    img: "./assets/img/freestocks-org-Fx5rrxSaUtI-unsplash.jpg",
  },
  {
    itemId: "ukelele",
    desc:
      "<strong>Kids Song for Ukelele.</strong> You'll learn 15 classic children's songs. Perfect for the new parent or early education teacher. Lessons assume no prior musical knowledge.",
    price: 1000,
    title: "Mock Ukelele",
    img: "./assets/img/rushina-morrison-fEdo2qJ647U-unsplash.jpg",
  },
  {
    itemId: "drums",
    desc:
      "<strong>Start Your Journey.</strong> From easy fills to advanced topics like metric modulation, these 15 lessons will help take your drumming to the next level.",
    price: 3000,
    title: "Mock Drum",
    img: "./assets/img/drums2.jpeg",
  },
  {
    itemId: "banjo",
    desc:
      "<strong>Intro to Bluegrass Banjo.</strong> Get started with this class style made famous by the iconic Earl Scruggs. 15 lessons, 12 songs perfect for back porch jams ",
    price: 3500,
    title: "Mock Banjo",
    img: "./assets/img/banjo.jpeg",
  },
  {
    itemId: "g2",
    desc:
      "<strong>Theorize this.</strong> For the budding songwriter and composer, 5 lessons to introduce you to common chord structures and haromonies",
    price: 1500,
    title: "Mock Music Theory",
    img: "./assets/img/freestocks-org-Fx5rrxSaUtI-unsplash.jpg",
  },
];

var config = {
  video_discount_factor: ".2",
  video_min_items_for_discount: 2,
  checkout_base_price: 2000,
  basePrice: 2000,
  checkout_currency: "usd",
  checkout_event_name: "Spring Academy Concert",
  checkout_image:
    "https://d37ugbyn3rpeym.cloudfront.net/partner-program/edu/kidvert.jpeg",
};

exports.items_data = items_data;
exports.config = config;
