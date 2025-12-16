
import React from 'react';

interface ProcessStepProps {
  icon: string;
  title: string;
  description: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ icon, title, description }) => (
  <div className="group flex flex-col items-center text-center gap-4 p-6 rounded-xl hover:bg-background-light dark:hover:bg-background-dark transition-colors border border-transparent hover:border-border-light dark:hover:border-border-dark">
    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
      <span className="material-symbols-outlined text-[32px]">{icon}</span>
    </div>
    <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">{title}</h3>
    <p className="text-sm text-text-sec-light dark:text-text-sec-dark leading-relaxed">
      {description}
    </p>
  </div>
);

export const ProcessSection: React.FC = () => {
  const steps: ProcessStepProps[] = [
    {
      icon: "post_add",
      title: "Nộp bài trực tuyến",
      description: "Tác giả đăng ký tài khoản và nộp bản thảo qua hệ thống, hỗ trợ nhiều định dạng tệp và kiểm tra đạo văn sơ bộ."
    },
    {
      icon: "rate_review",
      title: "Phản biện khoa học",
      description: "Quy trình phản biện kín hai chiều (double-blind peer review) được quản lý tự động, đảm bảo tính khách quan."
    },
    {
      icon: "gavel",
      title: "Ra quyết định",
      description: "Ban chương trình dựa trên kết quả phản biện để đưa ra quyết định chấp nhận hoặc từ chối bài báo."
    },
    {
      icon: "menu_book",
      title: "Xuất bản kỷ yếu",
      description: "Các bài được chấp nhận sẽ được biên tập và xuất bản trong kỷ yếu hội nghị có chỉ số ISBN/ISSN."
    }
  ];

  return (
    <div className="w-full bg-white dark:bg-card-dark py-20 border-y border-border-light dark:border-border-dark">
      <div className="layout-container flex justify-center w-full">
        <div className="px-5 md:px-10 lg:px-20 w-full max-w-[1200px]">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-main-light dark:text-text-main-dark sm:text-4xl">
                Quy trình Hệ thống
              </h2>
              <p className="text-text-sec-light dark:text-text-sec-dark text-base font-normal max-w-[720px]">
                UTH-ConfMS tối ưu hóa quy trình từ lúc nộp bài đến khi xuất bản kỷ yếu, đảm bảo tính minh bạch và chất lượng học thuật.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <ProcessStep 
                  key={index} 
                  icon={step.icon} 
                  title={step.title} 
                  description={step.description} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
