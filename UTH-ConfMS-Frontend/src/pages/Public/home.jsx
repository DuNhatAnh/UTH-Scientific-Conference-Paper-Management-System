export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: "40px" }}>
        <h1>Hội nghị Khoa học UTH 2025</h1>
        <p>
          Hệ thống quản lý bài báo khoa học – Trường Đại học Giao thông Vận tải
        </p>
      </header>

      {/* Giới thiệu */}
      <section style={{ marginBottom: "30px" }}>
        <h2>Giới thiệu</h2>
        <p>
          Đây là cổng thông tin chính thức để nộp bài, phản biện và quản lý
          các bài báo khoa học cho hội nghị UTH.
        </p>
      </section>

      {/* Thông tin quan trọng */}
      <section style={{ marginBottom: "30px" }}>
        <h2>Thông tin quan trọng</h2>
        <ul>
          <li>Hạn nộp bài: 30/03/2025</li>
          <li>Thông báo kết quả: 20/04/2025</li>
          <li>Ngày tổ chức hội nghị: 15/05/2025</li>
        </ul>
      </section>

      {/* Hành động */}
      <section>
        <button style={{ padding: "10px 20px", marginRight: "10px" }}>
          Đăng nhập
        </button>
        <button style={{ padding: "10px 20px" }}>
          Nộp bài báo
        </button>
      </section>
    </div>
  );
}
