import json
import random
from datetime import datetime, timedelta

# 1. 노드 정보 및 기본 데이터 정의
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

# 노드 정보를 쉽게 찾을 수 있도록 딕셔너리로 변환
nodes_by_location = {node["scanLocation"]: node for node in nodes_info}
nodes_by_step = {step: [] for step in ["Factory", "WMS", "LogiHub", "Wholesaler", "Reseller"]}
for node in nodes_info:
    if node["businessStep"] in nodes_by_step:
        nodes_by_step[node["businessStep"]].append(node)
factory_wms_map = {
    "인천공장": "인천공장창고", "화성공장": "화성공장창고",
    "양산공장": "양산공장창고", "구미공장": "구미공장창고"
}
step_order = ["Factory", "WMS", "LogiHub", "Wholesaler", "Reseller", "POS"]

# 2. EPC 이력 생성 함수 (이전과 동일)
def generate_epc_history(anomalous_trip):
    """주어진 이상 트립을 포함하는 전체 EPC 이력을 생성합니다."""
    
    from_node = nodes_by_location.get(anomalous_trip["from"]["scanLocation"])
    to_node = nodes_by_location.get(anomalous_trip["to"]["scanLocation"])

    if not from_node or not to_node:
        print(f"Warning: Skipping trip with invalid scanLocation. From: {anomalous_trip['from']['scanLocation']}, To: {anomalous_trip['to']['scanLocation']}")
        return []

    prologue_path = []
    current_step = from_node
    while current_step["businessStep"] != "Factory":
        prev_step_index = step_order.index(current_step["businessStep"]) - 1
        if prev_step_index < 0: break
        prev_step_name = step_order[prev_step_index]
        prev_node = None
        if prev_step_name == "WMS":
            for f, w in factory_wms_map.items():
                if w == current_step["scanLocation"]:
                    prev_node = nodes_by_location.get(f)
                    break
        if not prev_node:
            prev_node = random.choice(nodes_by_step.get(prev_step_name, []))
        prologue_path.insert(0, prev_node)
        current_step = prev_node

    epilogue_path = []
    current_step = to_node
    while current_step["businessStep"] not in ["POS", "Reseller"]:
        next_step_index = step_order.index(current_step["businessStep"]) + 1
        if next_step_index >= len(step_order): break
        next_step_name = step_order[next_step_index]
        next_node = random.choice(nodes_by_step.get(next_step_name, []))
        epilogue_path.append(next_node)
        current_step = next_node

    full_path_nodes = prologue_path + [from_node, to_node] + epilogue_path
    unique_path_nodes = []
    last_node_location = None
    for node in full_path_nodes:
        if node["scanLocation"] != last_node_location:
            unique_path_nodes.append(node)
            last_node_location = node["scanLocation"]

    history = []
    anomaly_from_time = datetime.fromtimestamp(anomalous_trip["from"]["eventTime"])
    anomaly_to_time = datetime.fromtimestamp(anomalous_trip["to"]["eventTime"])
    
    from_index = -1
    for i, node in enumerate(unique_path_nodes):
        if node["scanLocation"] == from_node["scanLocation"]:
            from_index = i
            break
            
    if from_index == -1: return [] # from_node를 경로에서 찾지 못한 경우

    for i, node in enumerate(unique_path_nodes):
        event_time_dt = None
        if i == from_index:
            event_time_dt = anomaly_from_time
        elif i == from_index + 1:
            event_time_dt = anomaly_to_time
        elif i < from_index:
            time_diff_hours = (from_index - i) * random.uniform(4, 8)
            event_time_dt = anomaly_from_time - timedelta(hours=time_diff_hours)
        elif i > from_index + 1:
            time_diff_hours = (i - (from_index + 1)) * random.uniform(4, 8)
            event_time_dt = anomaly_to_time + timedelta(hours=time_diff_hours)

        is_anomaly_event = (i == from_index + 1)
        
        history.append({
            "eventId": int(f"{anomalous_trip['roadId']}{i+1}"), # roadId 기반 고유 eventId 생성
            "epcCode": anomalous_trip["epcCode"],
            "locationId": list(nodes_by_location.keys()).index(node["scanLocation"]) + 1,
            "scanLocation": node["scanLocation"],
            "hubType": node["hubType"],
            "businessStep": node["businessStep"],
            "eventType": "Aggregation" if i == 0 else f'{unique_path_nodes[i-1]["businessStep"]}_Outbound',
            "eventTime": event_time_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "anomaly": 98 if is_anomaly_event else 0,
            "anomalyTypeList": anomalous_trip["anomalyTypeList"] if is_anomaly_event else []
        })
        
    return history

# 3. 메인 실행 부분
if __name__ == "__main__":
    
    input_filename = "anomalies.json" # 입력 파일 이름
    output_filename = "epc_history.json" # 출력 파일 이름

    try:
        with open(input_filename, "r", encoding="utf-8") as f:
            anomalous_trips_data = json.load(f)
            anomalous_trips_list = anomalous_trips_data.get("data", [])
    except FileNotFoundError:
        print(f"오류: '{input_filename}' 파일을 찾을 수 없습니다. 스크립트와 같은 폴더에 파일을 위치시켜 주세요.")
        exit()

    all_events = []
    for trip in anomalous_trips_list:
        # 각 이상 트립에 대해 전체 이력 생성
        epc_full_history = generate_epc_history(trip)
        all_events.extend(epc_full_history)

    # 모든 이벤트를 'eventTime' 기준으로 최종 정렬
    sorted_events = sorted(all_events, key=lambda x: x["eventTime"])

    # JSON 파일로 저장
    output_data = {"data": sorted_events}
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 완료: {len(anomalous_trips_list)}개의 이상 트립으로부터 총 {len(sorted_events)}개의 이벤트 이력을 생성하여 '{output_filename}' 파일로 저장했습니다.")