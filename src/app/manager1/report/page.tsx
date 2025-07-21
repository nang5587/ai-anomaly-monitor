"use client";

import { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  ArcElement,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const productOptions = ["제품A", "제품B"];
const lotOptions = {
  제품A: ["로트1-001", "로트1-002"],
  제품B: ["로트2-001", "로트2-002"],
};
const menuOptions = ["통계 요약", "이상 탐지 리포트", "이상 사례 조회"];
const reportTypes = ["전체", "시공간 점프", "이벤트 순서 오류", "위조 EPC"];

const makeDoughnutData = (정상: number, 이상: number) => ({
  labels: ["정상", "이상"],
  datasets: [
    {
      label: "이상 탐지 비율",
      data: [정상, 이상],
      backgroundColor: ["#36A2EB", "#FF6384"],
      borderWidth: 1,
    },
  ],
});

export default function ReportPage() {
  const reportRef = useRef(null);
  const printRef = useRef(null);
  const [product, setProduct] = useState("");
  const [lot, setLot] = useState("");
  const [menu, setMenu] = useState("");
  const [type, setType] = useState("");
  const [summaryStats, setSummaryStats] = useState({});
  const [reportList, setReportList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reportDetails, setReportDetails] = useState([]);

  const isReady = product && lot && menu && type;

  useEffect(() => {
    const fetchReportList = async () => {
      if (isReady) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report`, {
            params: { product, lot, menu, type },
          });
          setReportList(res.data);
          setSelectedItem(res.data[0]?.id ?? null);
        } catch (error) {
          console.error("리포트 리스트 조회 실패", error);
        }
      }
    };
    fetchReportList();
  }, [product, lot, menu, type]);

  useEffect(() => {
    const fetchReportDetail = async () => {
      if (selectedItem) {
        try {
          const res = await axios.get("/api/report/detail", {
            params: { reportId: selectedItem },
          });
          setReportDetails(res.data.details);
          setSummaryStats(res.data.summaryStats || {});
        } catch (error) {
          console.error("리포트 상세 조회 실패", error);
          setReportDetails([]);
          setSummaryStats({});
        }
      }
    };
    fetchReportDetail();
  }, [selectedItem]);

  const handleDownload = async (format) => {
    if (!printRef.current || !selectedItem) return;

    const element = printRef.current;
    element.style.display = "block";

    const opt = {
      margin: 0.5,
      filename: `${selectedItem}.${format === "pdf" ? "pdf" : "xlsx"}`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(element).save();
    element.style.display = "none";
  };

  return (
    <div className="min-h-screen px-3 pt-5 text-white bg-black">
      <div className="flex items-center justify-between px-3 pt-5">
        <div className="flex gap-4">
          <select value={product} onChange={(e) => { setProduct(e.target.value); setLot(""); }} className="px-3 py-2 text-black rounded">
            <option value="">제품 선택</option>
            {productOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={lot} onChange={(e) => setLot(e.target.value)} disabled={!product} className="px-3 py-2 text-black rounded">
            <option value="">로트 선택</option>
            {lotOptions[product]?.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={menu} onChange={(e) => setMenu(e.target.value)} className="px-3 py-2 text-black rounded">
            <option value="">리포트 선택</option>
            {menuOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-black rounded">
            <option value="">항목 선택</option>
            {reportTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex gap-4">
          <button onClick={() => handleDownload("pdf")} className="px-6 py-2 text-white bg-gray-700 rounded">PDF 저장</button>
          <button onClick={() => handleDownload("excel")} className="px-6 py-2 text-white bg-gray-700 rounded">EXCEL 저장</button>
        </div>
      </div>

      <div className="flex gap-4 px-3 pt-5 flex-grow overflow-hidden min-h-[800px]">
        <aside className="w-[240px] overflow-y-auto bg-white text-black rounded-lg shadow p-6">
          <h3 className="mb-2 font-semibold">리스트</h3>
          {reportList.map((item) => (
            <div key={item.id} onClick={() => setSelectedItem(item.id)}
              className={`cursor-pointer p-2 mb-1 rounded hover:bg-gray-200 ${selectedItem === item.id ? "bg-gray-300 font-semibold" : ""}`}>{item.label}</div>
          ))}
        </aside>

        <main className="flex-1 bg-white text-black rounded-lg shadow p-6 min-h-[800px]">
          <div ref={reportRef} className="h-[calc(100vh-260px)] overflow-y-auto pr-2">
            <h2 className="mb-4 text-lg font-bold">{selectedItem ? `${selectedItem} 리포트` : "리포트 없음"}</h2>
            {Object.keys(summaryStats).length > 0 && (
              <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
                <h3 className="mb-2 font-semibold text-md">이벤트 요약 통계</h3>
                <Bar data={{ labels: Object.keys(summaryStats), datasets: [{ label: "이벤트 수", data: Object.values(summaryStats), backgroundColor: "rgba(75, 192, 192, 0.5)" }] }}
                     options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                <div style={{ width: "100%", maxWidth: "400px", margin: "2rem auto 0" }}>
                  <Doughnut data={makeDoughnutData(80, 20)} />
 
                </div>
              </div>
            )}
            {reportDetails.length > 0 && (
              <ul className="space-y-2">
                {reportDetails.map((detail, i) => (
                  <li key={i} className="p-2 bg-gray-100 border border-gray-200 rounded">{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      
      <div
  ref={printRef}
  className="hidden p-6 text-black bg-white"
  style={{
    width: "794px",           // A4 기준
    maxWidth: "100%",
    overflow: "hidden",
  }}
>
        <h2 className="mb-4 text-lg font-bold">{selectedItem} 리포트</h2>
        <h3 className="mb-2 font-semibold text-md">이벤트 요약 통계</h3>
        <Bar data={{ labels: Object.keys(summaryStats), datasets: [{ label: "이벤트 수", data: Object.values(summaryStats), backgroundColor: "rgba(75, 192, 192, 0.5)" }] }}
             options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        <div className="w-1/2 mx-auto mt-6 space-y-6">
  <Doughnut data={makeDoughnutData(80, 20)} />
  <Doughnut data={makeDoughnutData(60, 40)} />
  <Doughnut data={makeDoughnutData(70, 30)} />
  <Doughnut data={makeDoughnutData(90, 10)} />
  <Doughnut data={makeDoughnutData(50, 50)} />
</div>
        <ul className="mt-6 space-y-2">
          {reportDetails.map((detail, i) => (
            <li key={i} className="p-2 bg-gray-100 border border-gray-200 rounded">{detail}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
