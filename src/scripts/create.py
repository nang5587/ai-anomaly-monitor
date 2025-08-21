import json
import random
from datetime import datetime, timedelta

nodes_info = [
    { "hubType": "ICN_Factory", "scanLocation": "인천공장", "businessStep": "Factory", "coord": [126.65, 37.45] },
    { "hubType": "HWS_Factory", "scanLocation": "화성공장", "businessStep": "Factory", "coord": [126.83, 37.20] },
    { "hubType": "YGS_Factory", "scanLocation": "양산공장", "businessStep": "Factory", "coord": [129.04, 35.33] },
    { "hubType": "KUM_Factory", "scanLocation": "구미공장", "businessStep": "Factory", "coord": [128.40, 36.13] },
    { "hubType": "ICN_WMS", "scanLocation": "인천공장창고", "businessStep": "WMS", "coord": [126.66, 37.46] },
    { "hubType": "HWS_WMS", "scanLocation": "화성공장창고", "businessStep": "WMS", "coord": [126.84, 37.21] },
    { "hubType": "YGS_WMS", "scanLocation": "양산공장창고", "businessStep": "WMS", "coord": [129.05, 35.34] },
    { "hubType": "KUM_WMS", "scanLocation": "구미공장창고", "businessStep": "WMS", "coord": [128.41, 36.14] },
    { "hubType": "SEL_Logi_HUB", "scanLocation": "수도권물류센터", "businessStep": "LogiHub", "coord": [127.20, 37.35] },
    { "hubType": "JB_Logi_HUB", "scanLocation": "전북물류센터", "businessStep": "LogiHub", "coord": [127.15, 35.82] },
    { "hubType": "JN_Logi_HUB", "scanLocation": "전남물류센터", "businessStep": "LogiHub", "coord": [126.90, 35.15] },
    { "hubType": "KB_Logi_HUB", "scanLocation": "경북물류센터", "businessStep": "LogiHub", "coord": [128.52, 35.87] },
    { "hubType": "SEL_WS1", "scanLocation": "수도권_도매상1", "businessStep": "Wholesaler", "coord": [127.05, 37.55] },
    { "hubType": "SEL_WS2", "scanLocation": "수도권_도매상2", "businessStep": "Wholesaler", "coord": [126.95, 37.60] },
    { "hubType": "SEL_WS3", "scanLocation": "수도권_도매상3", "businessStep": "Wholesaler", "coord": [127.15, 37.50] },
    { "hubType": "JB_WS1", "scanLocation": "전북_도매상1", "businessStep": "Wholesaler", "coord": [127.10, 35.90] },
    { "hubType": "JB_WS2", "scanLocation": "전북_도매상2", "businessStep": "Wholesaler", "coord": [126.98, 35.80] },
    { "hubType": "JB_WS3", "scanLocation": "전북_도매상3", "businessStep": "Wholesaler", "coord": [127.25, 35.75] },
    { "hubType": "JN_WS1", "scanLocation": "전남_도매상1", "businessStep": "Wholesaler", "coord": [126.85, 35.25] },
    { "hubType": "JN_WS3", "scanLocation": "전남_도매상3", "businessStep": "Wholesaler", "coord": [127.05, 35.10] },
    { "hubType": "KB_WS1", "scanLocation": "경북_도매상1", "businessStep": "Wholesaler", "coord": [128.60, 35.95] },
    { "hubType": "KB_WS2", "scanLocation": "경북_도매상2", "businessStep": "Wholesaler", "coord": [128.45, 36.00] },
    { "hubType": "SEL_WS1_R1", "scanLocation": "수도권_도매상1_권역_소매상1", "businessStep": "Reseller", "coord": [127.055, 37.555] },
    { "hubType": "SEL_WS1_R2", "scanLocation": "수도권_도매상1_권역_소매상2", "businessStep": "Reseller", "coord": [127.045, 37.555] },
    { "hubType": "SEL_WS1_R3", "scanLocation": "수도권_도매상1_권역_소매상3", "businessStep": "Reseller", "coord": [127.050, 37.560] },
    { "hubType": "SEL_WS2_R1", "scanLocation": "수도권_도매상2_권역_소매상1", "businessStep": "Reseller", "coord": [126.955, 37.605] },
    { "hubType": "SEL_WS2_R2", "scanLocation": "수도권_도매상2_권역_소매상2", "businessStep": "Reseller", "coord": [126.945, 37.605] },
    { "hubType": "SEL_WS2_R3", "scanLocation": "수도권_도매상2_권역_소매상3", "businessStep": "Reseller", "coord": [126.950, 37.610] },
    { "hubType": "SEL_WS3_R1", "scanLocation": "수도권_도매상3_권역_소매상1", "businessStep": "Reseller", "coord": [127.155, 37.505] },
    { "hubType": "SEL_WS3_R2", "scanLocation": "수도권_도매상3_권역_소매상2", "businessStep": "Reseller", "coord": [127.145, 37.505] },
    { "hubType": "SEL_WS3_R3", "scanLocation": "수도권_도매상3_권역_소매상3", "businessStep": "Reseller", "coord": [127.150, 37.510] },
    { "hubType": "JB_WS1_R1", "scanLocation": "전북_도매상1_권역_소매상1", "businessStep": "Reseller", "coord": [127.105, 35.905] },
    { "hubType": "JB_WS1_R2", "scanLocation": "전북_도매상1_권역_소매상2", "businessStep": "Reseller", "coord": [127.095, 35.905] },
    { "hubType": "JB_WS1_R3", "scanLocation": "전북_도매상1_권역_소매상3", "businessStep": "Reseller", "coord": [127.100, 35.910] },
    { "hubType": "JB_WS2_R1", "scanLocation": "전북_도매상2_권역_소매상1", "businessStep": "Reseller", "coord": [126.985, 35.805] },
    { "hubType": "JB_WS2_R2", "scanLocation": "전북_도매상2_권역_소매상2", "businessStep": "Reseller", "coord": [126.975, 35.805] },
    { "hubType": "JB_WS2_R3", "scanLocation": "전북_도매상2_권역_소매상3", "businessStep": "Reseller", "coord": [126.980, 35.810] },
    { "hubType": "JB_WS3_R1", "scanLocation": "전북_도매상3_권역_소매상1", "businessStep": "Reseller", "coord": [127.255, 35.755] },
    { "hubType": "JB_WS3_R2", "scanLocation": "전북_도매상3_권역_소매상2", "businessStep": "Reseller", "coord": [127.245, 35.755] },
    { "hubType": "JB_WS3_R3", "scanLocation": "전북_도매상3_권역_소매상3", "businessStep": "Reseller", "coord": [127.250, 35.760] },
    { "hubType": "JN_WS1_R1", "scanLocation": "전남_도매상1_권역_소매상1", "businessStep": "Reseller", "coord": [126.855, 35.255] },
    { "hubType": "JN_WS1_R2", "scanLocation": "전남_도매상1_권역_소매상2", "businessStep": "Reseller", "coord": [126.845, 35.255] },
    { "hubType": "JN_WS1_R3", "scanLocation": "전남_도매상1_권역_소매상3", "businessStep": "Reseller", "coord": [126.850, 35.260] },
    { "hubType": "JN_WS2_R1", "scanLocation": "전남_도매상2_권역_소매상1", "businessStep": "Reseller", "coord": [126.755, 35.055] },
    { "hubType": "JN_WS2_R2", "scanLocation": "전남_도매상2_권역_소매상2", "businessStep": "Reseller", "coord": [126.745, 35.055] },
    { "hubType": "JN_WS2_R3", "scanLocation": "전남_도매상2_권역_소매상3", "businessStep": "Reseller", "coord": [126.750, 35.060] },
    { "hubType": "JN_WS3_R1", "scanLocation": "전남_도매상3_권역_소매상1", "businessStep": "Reseller", "coord": [127.055, 35.105] },
    { "hubType": "JN_WS3_R2", "scanLocation": "전남_도매상3_권역_소매상2", "businessStep": "Reseller", "coord": [127.045, 35.105] },
    { "hubType": "JN_WS3_R3", "scanLocation": "전남_도매상3_권역_소매상3", "businessStep": "Reseller", "coord": [127.050, 35.110] },
    { "hubType": "KB_WS1_R1", "scanLocation": "경북_도매상1_권역_소매상1", "businessStep": "Reseller", "coord": [128.605, 35.955] },
    { "hubType": "KB_WS1_R2", "scanLocation": "경북_도매상1_권역_소매상2", "businessStep": "Reseller", "coord": [128.595, 35.955] },
    { "hubType": "KB_WS1_R3", "scanLocation": "경북_도매상1_권역_소매상3", "businessStep": "Reseller", "coord": [128.600, 35.960] },
    { "hubType": "KB_WS2_R1", "scanLocation": "경북_도매상2_권역_소매상1", "businessStep": "Reseller", "coord": [128.455, 36.005] },
    { "hubType": "KB_WS2_R2", "scanLocation": "경북_도매상2_권역_소매상2", "businessStep": "Reseller", "coord": [128.445, 36.005] },
    { "hubType": "KB_WS2_R3", "scanLocation": "경북_도매상2_권역_소매상3", "businessStep": "Reseller", "coord": [128.450, 36.010] },
    { "hubType": "KB_WS3_R1", "scanLocation": "경북_도매상3_권역_소매상1", "businessStep": "Reseller", "coord": [128.705, 35.805] },
    { "hubType": "KB_WS3_R2", "scanLocation": "경북_도매상3_권역_소매상2", "businessStep": "Reseller", "coord": [128.695, 35.805] },
    { "hubType": "KB_WS3_R3", "scanLocation": "경북_도매상3_권역_소매상3", "businessStep": "Reseller", "coord": [128.700, 35.810] }
]

products = ["말보로", "던힐", "에쎄", "타이레놀", "아로나민골드정", "게보린"]
anomaly_types = ["fake", "tamper", "clone"]

nodes_by_step = {step: [] for step in ["Factory", "WMS", "LogiHub", "Wholesaler", "Reseller"]}
for node in nodes_info:
    if node["businessStep"] in nodes_by_step:
        nodes_by_step[node["businessStep"]].append(node)

factory_wms_map = {
    "인천공장": "인천공장창고",
    "화성공장": "화성공장창고",
    "양산공장": "양산공장창고",
    "구미공장": "구미공장창고"
}


def generate_trips(num_trips_to_generate):
    all_trips = []
    base_epc_num = 695 # 시작 EPC 번호
    road_id_counter = 1
    start_time = datetime(2025, 1, 1, 9, 0, 0)
    
    anomaly_types_pool = ["fake", "tamper", "clone"]

    while len(all_trips) < num_trips_to_generate:
        
        # 1. 이상 타입을 먼저 결정
        chosen_anomaly = random.choice(anomaly_types_pool)
        
        # 기본 정보 생성
        epc_code = f"1.880.123.{base_epc_num}"
        product_name = random.choice(products)
        epc_lot = f"LOTA-{random.randint(1000, 9999)}"
        
        # 2. 이상 타입에 맞는 데이터 및 경로 생성
        path = []
        
        if chosen_anomaly == "clone":
            # clone 시나리오: 동일 EPC로 두 개의 다른 경로 생성
            # 경로 1
            factory1 = random.choice(nodes_by_step["Factory"])
            wms1 = next(n for n in nodes_by_step["WMS"] if n["scanLocation"] == factory_wms_map[factory1["scanLocation"]])
            logihub1 = random.choice(nodes_by_step["LogiHub"])
            path1 = [factory1, wms1, logihub1]
            
            # 경로 2 (다른 지역에서 동시간대 발생)
            factory2 = random.choice([f for f in nodes_by_step["Factory"] if f != factory1])
            wms2 = next(n for n in nodes_by_step["WMS"] if n["scanLocation"] == factory_wms_map[factory2["scanLocation"]])
            path2 = [factory2, wms2]

            # 두 경로의 모든 트립에 'clone' 태그 부여
            clone_time = start_time
            for i in range(len(path1) - 1):
                all_trips.append(create_trip(road_id_counter, path1[i], path1[i+1], epc_code, product_name, epc_lot, clone_time, ["clone"]))
                road_id_counter += 1
                clone_time += timedelta(hours=random.randint(4, 8))

            clone_time = start_time + timedelta(minutes=random.randint(5, 30)) # 약간의 시간차
            for i in range(len(path2) - 1):
                all_trips.append(create_trip(road_id_counter, path2[i], path2[i+1], epc_code, product_name, epc_lot, clone_time, ["clone"]))
                road_id_counter += 1
                clone_time += timedelta(hours=random.randint(4, 8))
            
            start_time += timedelta(days=1)
            base_epc_num += 1
            continue # clone은 독립적으로 처리되므로 루프 다음으로

        elif chosen_anomaly == "fake":
            epc_code = f"FAKE.EPC.{random.randint(10000, 99999)}"
            # 경로는 짧은 정상 흐름
            factory = random.choice(nodes_by_step["Factory"])
            wms = next(n for n in nodes_by_step["WMS"] if n["scanLocation"] == factory_wms_map[factory["scanLocation"]])
            logihub = random.choice(nodes_by_step["LogiHub"])
            path = [factory, wms, logihub]

        elif chosen_anomaly == "tamper":
            epc_code = f"1.880.123.{base_epc_num}_TAMPER"
            # 경로는 규칙 위반 (소매 -> 소매) 또는 역행
            scenario = random.choice(["reseller_move", "reverse"])
            if scenario == "reseller_move":
                reseller1, reseller2 = random.sample(nodes_by_step["Reseller"], 2)
                path = [reseller1, reseller2]
            else: # reverse
                logihub = random.choice(nodes_by_step["LogiHub"])
                wholesaler = random.choice(nodes_by_step["Wholesaler"])
                path = [logihub, wholesaler, logihub]
        
        # 3. 경로를 트립으로 변환하고, 마지막 트립에 비정상 태그 부여
        for i in range(len(path) - 1):
            trip_time = start_time + timedelta(hours=i*5, minutes=random.randint(0, 59))
            
            # 마지막 이동에만 비정상 태그를 적용
            is_last_trip = i == len(path) - 2
            current_anomaly_list = [chosen_anomaly] if is_last_trip else []
            
            all_trips.append(create_trip(road_id_counter, path[i], path[i+1], epc_code, product_name, epc_lot, trip_time, current_anomaly_list))
            road_id_counter += 1
        
        start_time += timedelta(hours=2)
        base_epc_num += 1

    return all_trips



def create_trip(road_id, from_node, to_node, epc_code, product_name, epc_lot, start_time, anomaly_list):
    duration_hours = random.uniform(3, 8)
    end_time = start_time + timedelta(hours=duration_hours)
    
    final_anomaly_list = anomaly_list if anomaly_list else []
    
    return {
        "roadId": road_id,
        "from": {
            "scanLocation": from_node["scanLocation"],
            "coord": from_node["coord"],
            # [수정] * 1000 제거 -> 초 단위 정수로 변경
            "eventTime": int(start_time.timestamp()),
            "businessStep": from_node["businessStep"]
        },
        "to": {
            "scanLocation": to_node["scanLocation"],
            "coord": to_node["coord"],
            # [수정] * 1000 제거 -> 초 단위 정수로 변경
            "eventTime": int(end_time.timestamp()),
            "businessStep": to_node["businessStep"]
        },
        "epcCode": epc_code,
        "productName": product_name,
        "epcLot": epc_lot,
        "eventType": f'{from_node["businessStep"]}_Outbound',
        "anomalyTypeList": final_anomaly_list
    }


# 3. 메인 실행 부분
if __name__ == "__main__":
    generated_trips = generate_trips(60)
    
    # eventTime 순으로 최종 정렬
    sorted_trips = sorted(generated_trips, key=lambda x: x["from"]["eventTime"])

    # JSON 파일로 저장
    output_data = {"data": sorted_trips}
    with open("trips_data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 완료: {len(sorted_trips)}개의 트립 데이터가 'trips_data.json' 파일로 저장되었습니다.")