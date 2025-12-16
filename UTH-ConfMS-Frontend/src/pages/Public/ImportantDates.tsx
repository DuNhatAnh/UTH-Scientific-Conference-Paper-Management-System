
import React from 'react';

export const ImportantDates: React.FC = () => {
  const dates = [
    {
      date: "15/05/2024",
      title: "Hạn nộp tóm tắt",
      desc: "Hạn chót nộp bản tóm tắt (Abstract)",
      active: false
    },
    {
      date: "01/06/2024",
      title: "Hạn nộp toàn văn",
      desc: "Hạn chót nộp bài báo toàn văn (Full Paper)",
      active: true
    },
    {
      date: "20/06/2024",
      title: "Thông báo kết quả",
      desc: "Gửi thông báo chấp nhận/từ chối",
      active: false
    },
    {
      date: "30/06/2024",
      title: "Đăng ký tham dự",
      desc: "Hạn chót đăng ký Early Bird",
      active: false
    }
  ];

  return (
    <div className="w-full bg-background-light dark:bg-background-dark py-16">
      <div className="layout-container flex justify-center w-full">
        <div className="px-5 md:px-10 lg:px-20 w-full max-w-[1200px]">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main-dark">
                Mốc Thời Gian Quan Trọng
              </h2>
              <div className="h-1 w-20 bg-primary rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dates.map((item, index) => (
                <div key={index} className={`relative p-6 rounded-xl border ${item.active ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' : 'border-border-light dark:border-border-dark bg-white dark:bg-card-dark'} transition-all hover:shadow-md`}>
                  {item.active && (
                    <div className="absolute top-4 right-4 animate-pulse">
                      <span className="flex h-3 w-3 rounded-full bg-primary"></span>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined">calendar_month</span>
                      <span className="text-lg font-bold">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">{item.title}</h3>
                    <p className="text-sm text-text-sec-light dark:text-text-sec-dark">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};