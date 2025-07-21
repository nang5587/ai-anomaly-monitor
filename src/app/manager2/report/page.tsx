"use client";

import { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const productOptions = ["제품A", "제품B"];
const lotOptions = {
  제품A: ["로트1-001", "로트1-002"],
  제품B: ["로트2-001", "로트2-002"],
};
const menuOptions = ["통계 요약", "이상 탐지 리포트", "이상 사례 조회"];
const reportTypes = ["전체", "시공간 점프", "이벤트 순서 오류", "위조 EPC"];

export default function ReportPage() {
  const reportRef = useRef(null);
  const [product, setProduct] = useState("");
  const [lot, setLot] = useState("");
  const [menu, setMenu] = useState("");
  const [type, setType] = useState("");
  const [summaryStats, setSummaryStats] = useState<{ [key: string]: number }>({});
  const [reportList, setReportList] = useState<{ id: string; label: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState<string[]>([]);

  const isReady = product && lot && menu && type;

  // 리포트 리스트 가져오기
  useEffect(() => {
    const fetchReportList = async () => {
      if (isReady) {
        try {
          const res = await axios.get("/api/reports", {
            params: { product, lot, menu, type },
          });
          const data: { id: string; label: string }[] = res.data;
          setReportList(data);
          setSelectedItem(data[0]?.id ?? null);
        } catch (error) {
          console.error("리포트 리스트 조회 실패", error);
        }
      }
    };
    fetchReportList();
  }, [product, lot, menu, type]);

  // 리포트 상세내용 가져오기
  useEffect(() => {
    const fetchReportDetail = async () => {
      if (selectedItem) {
        try {
          const res = await axios.get("/api/reports/detail", {
            params: { reportId: selectedItem },
          });
          const data: {
            title: string;
            details: string[];
            summaryStats?: Record<string, number>;
          } = res.data;
          setReportDetails(data.details);
          setSummaryStats(data.summaryStats || {});
        } catch (error) {
          console.error("리포트 상세 조회 실패", error);
          setReportDetails([]);
          setSummaryStats({});
        }
      }
    };
    fetchReportDetail();
  }, [selectedItem]);

  // PDF/Excel 저장
  const handleDownload = (format: "pdf" | "excel") => {
    if (!reportRef.current || !selectedItem) return;
    const opt = {
      margin: 0.5,
      filename: `${selectedItem}.${format === "pdf" ? "pdf" : "xlsx"}`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  return (
    <div className="min-h-screen px-3 pt-5 text-white bg-black">
      {/* 메뉴바 + 버튼 영역 */}
      <div className="flex items-center justify-between px-3 pt-5">
        {/* 셀렉트 메뉴 */}
        <div className="flex gap-4">
          <select
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              setLot("");
            }}
            className="px-3 py-2 text-black rounded"
          >
            <option value="">제품 선택</option>
            {productOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            disabled={!product}
            className="px-3 py-2 text-black rounded"
          >
            <option value="">로트 선택</option>
            {lotOptions[product]?.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            className="px-3 py-2 text-black rounded"
          >
            <option value="">리포트 선택</option>
            {menuOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-black rounded"
          >
            <option value="">항목 선택</option>
            {reportTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 다운로드 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => handleDownload("pdf")}
            className="px-6 py-2 text-white bg-gray-700 rounded"
          >
            PDF 저장
          </button>
          <button
            onClick={() => handleDownload("excel")}
            className="px-6 py-2 text-white bg-gray-700 rounded"
          >
            EXCEL 저장
          </button>
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="flex gap-4 px-3 pt-5 flex-grow overflow-hidden min-h-[800px]">
        {/* 리스트 */}
        <aside className="w-[240px] overflow-y-auto bg-white text-black rounded-lg shadow p-6">
          <h3 className="mb-2 font-semibold">리스트</h3>
          {reportList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              className={`cursor-pointer p-2 mb-1 rounded hover:bg-gray-200 ${
                selectedItem === item.id ? "bg-gray-300 font-semibold" : ""
              }`}
            >
              {item.label}
            </div>
          ))}
        </aside>

        {/* 리포트 본문 */}
        <main
          ref={reportRef}
          className="flex-1 overflow-y-auto bg-white text-black rounded-lg shadow p-6 min-h-[800px]"
        >
          <h2 className="mb-4 text-lg font-bold">
            {selectedItem ? `${selectedItem} 리포트` : "리포트 없음"}
          </h2>

          {/*  차트 시각화 */}
          {Object.keys(summaryStats).length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-md">이벤트 요약 통계</h3>
              <Bar
                data={{
                  labels: Object.keys(summaryStats),
                  datasets: [
                    {
                      label: "이벤트 수",
                      data: Object.values(summaryStats),
                      backgroundColor: "rgba(75, 192, 192, 0.5)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          )}

          {/*  상세 설명 */}
          {reportDetails.length > 0 && (
            <ul className="space-y-2">
              {reportDetails.map((detail, i) => (
                <li
                  key={i}
                  className="p-2 bg-gray-100 border border-gray-200 rounded"
                >
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
