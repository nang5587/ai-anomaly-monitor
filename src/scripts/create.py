import json
import random
from datetime import datetime, timedelta

# 1. 입력 데이터 및 설정 (이전과 동일)
# =================================

NODES_INFO = [
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
PRODUCTS = ["말보로 레드", "던힐 프로스트", "에쎄 체인지", "타이레놀 500mg", "아로나민 골드", "게보린"]
ANOMALY_DESCRIPTIONS = {
    "type_anomaly": {
        "fake": "정식으로 등록되지 않은 새로운 EPC 코드가 감지되었습니다. 위조품일 가능성이 있습니다.",
        "tamper": "기존 EPC 코드가 비정상적으로 변조된 것으로 의심됩니다.",
        "clone": "하나의 EPC 코드가 동시간대에 여러 위치에서 동시에 감지되었습니다. 코드 복제를 통한 불법 유통일 수 있습니다.",
    },
    "percent_anomaly": "이 구간의 이동 패턴이 비정상적입니다. 시스템은 과거 데이터와 비교하여 높은 확률로 이상 이동으로 분류했습니다. (예: 경로 역행, 단계 건너뛰기, 비정상적 소요 시간 등)"
}

# 2. 데이터 전처리 및 헬퍼 함수 (이전과 동일)
# =================================

nodes_by_step = {step: [] for step in ["Factory", "WMS", "LogiHub", "Wholesaler", "Reseller"]}
for node in NODES_INFO:
    if node["businessStep"] in nodes_by_step:
        nodes_by_step[node["businessStep"]].append(node)
node_map = {node["scanLocation"]: node for node in NODES_INFO}

def create_trip(road_id, from_node, to_node, epc_info, time_info, anomaly_info):
    """단일 트립 객체를 생성하는 헬퍼 함수"""
    description_parts = []
    if anomaly_info["type"]:
        description_parts.append(ANOMALY_DESCRIPTIONS["type_anomaly"][anomaly_info["type"]])
    if anomaly_info["percent"] >= 50:
        description_parts.append(ANOMALY_DESCRIPTIONS["percent_anomaly"])
    
    return {
        "roadId": road_id,
        "from": {
            "scanLocation": from_node["scanLocation"], "coord": from_node["coord"],
            "eventTime": int(time_info["start"].timestamp()), "businessStep": from_node["businessStep"]
        },
        "to": {
            "scanLocation": to_node["scanLocation"], "coord": to_node["coord"],
            "eventTime": int(time_info["end"].timestamp()), "businessStep": to_node["businessStep"]
        },
        "epcCode": epc_info["code"], "productName": epc_info["product"], "epcLot": epc_info["lot"],
        "eventType": "출고",
        "anomaly": anomaly_info["percent"],
        "anomalyTypeList": [anomaly_info["type"]] if anomaly_info["type"] else [],
        "description": " ".join(description_parts)
    }

# 3. 이상 시나리오 생성 함수 (로직 대폭 수정)
# =================================

def generate_all_anomaly_trips(num_trips_target):
    all_trips = []
    road_id_counter = 1
    epc_counter = 695
    clone_set_count = 0
    start_time = datetime(2024, 1, 1, 9, 0, 0)
    
    while len(all_trips) < num_trips_target:
        # 시나리오 결정
        if clone_set_count < 4 and random.random() < 0.1: # 약 10% 확률로 복제 시나리오 생성
            scenario_type = 'clone'
            clone_set_count += 1
        else:
            scenario_type = random.choice(['fake', 'tamper', 'rule_violation'])
        
        # --- 시나리오별 단일 또는 그룹 이상 트립 생성 ---
        
        if scenario_type == 'clone':
            epc_code = f"1.880.123.{epc_counter}"
            product_name = random.choice(PRODUCTS)
            epc_lot = f"LOT-C-{random.randint(1000, 9999)}"
            
            # 2~3개의 복제 트립 생성
            num_clones = random.randint(2, 3)
            # 서로 다른 출발지와 도착지 선택
            node_pairs = random.sample(list(node_map.values()), k=num_clones * 2)

            for i in range(num_clones):
                if len(all_trips) >= num_trips_target: break
                
                from_node = node_pairs[i*2]
                to_node = node_pairs[i*2+1]
                
                # 시간은 거의 동시간대로 설정
                current_time = start_time + timedelta(minutes=random.randint(0, 30))
                duration = timedelta(hours=random.uniform(2, 5))
                
                # 모든 복제 트립은 anomalyTypeList에 'clone'이 있고, anomaly 수치도 높음
                anomaly_info = {"type": "clone", "percent": random.randint(70, 100)}

                all_trips.append(create_trip(
                    road_id_counter, from_node, to_node,
                    {"code": epc_code, "product": product_name, "lot": epc_lot},
                    {"start": current_time, "end": current_time + duration},
                    anomaly_info
                ))
                road_id_counter += 1
            epc_counter += 1
            start_time += timedelta(days=1) # 다음 복제 세트는 다른 날짜에
            continue

        # --- fake, tamper, rule_violation (단일 트립 생성) ---
        
        # 출발지/도착지 및 EPC 결정
        if scenario_type == 'rule_violation':
            # 물류 흐름 위반 경로 생성
            violation = random.choice(['reverse', 'hop', 'forbidden'])
            if violation == 'reverse':
                from_node = random.choice(nodes_by_step["Wholesaler"])
                to_node = random.choice(nodes_by_step["LogiHub"])
            elif violation == 'hop':
                from_node = random.choice(nodes_by_step["LogiHub"])
                to_node = random.choice(nodes_by_step["Reseller"])
            else: # forbidden
                from_node, to_node = random.sample(nodes_by_step["Reseller"], 2)
            epc_code = f"1.880.123.{epc_counter}"
        elif scenario_type == 'fake':
            from_node, to_node = random.sample(list(node_map.values()), 2)
            epc_code = f"1.880.123.{random.randint(10000, 99999)}"
        else: # tamper
            from_node, to_node = random.sample(list(node_map.values()), 2)
            epc_code = f"2.{random.randint(100, 999)}.{random.randint(100, 999)}.{random.randint(1000, 9999)}"

        product_name = random.choice(PRODUCTS)
        epc_lot = f"LOT-A-{random.randint(1000, 9999)}"

        # **핵심 로직**: 모든 트립이 이상 조건을 만족하도록 보장
        anomaly_info = {}
        if scenario_type == 'rule_violation':
            # 규칙 위반은 타입 없이 높은 anomaly 수치만 가짐
            anomaly_info["type"] = None
            anomaly_info["percent"] = random.randint(50, 100)
        else: # fake, tamper
            # 타입은 항상 존재
            anomaly_info["type"] = scenario_type
            # 70% 확률로 높은 anomaly 수치도 함께 가짐
            if random.random() < 0.7:
                anomaly_info["percent"] = random.randint(50, 100)
            else:
                anomaly_info["percent"] = random.randint(10, 49)

        duration = timedelta(hours=random.uniform(5, 10))
        all_trips.append(create_trip(
            road_id_counter, from_node, to_node,
            {"code": epc_code, "product": product_name, "lot": epc_lot},
            {"start": start_time, "end": start_time + duration},
            anomaly_info
        ))

        road_id_counter += 1
        epc_counter += 1
        start_time += timedelta(hours=random.randint(1, 3))
    
    return all_trips

# 4. 메인 실행
# =================================
if __name__ == "__main__":
    generated_trips = generate_all_anomaly_trips(60)
    
    # from.eventTime 순으로 최종 정렬
    sorted_trips = sorted(generated_trips, key=lambda x: x["from"]["eventTime"])

    # JSON 파일로 저장
    output_data = {"data": sorted_trips}
    with open("guaranteed_anomaly_trips.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 완료: {len(sorted_trips)}개의 '보장된 이상 트립' 데이터가 'guaranteed_anomaly_trips.json' 파일로 저장되었습니다.")