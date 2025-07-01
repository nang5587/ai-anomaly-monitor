// 간단한 정육면체(창고, 도소매점 등) 모델 데이터 (.obj 형식)
export const cubeModel = `
# Vertices
v -1.0 -1.0 -1.0
v -1.0 -1.0 1.0
v -1.0 1.0 1.0
v -1.0 1.0 -1.0
v 1.0 -1.0 -1.0
v 1.0 -1.0 1.0
v 1.0 1.0 1.0
v 1.0 1.0 -1.0
# Faces
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;

export const factoryBuildingModel = `
v -1.0 -1.0 -1.0
v -1.0 -1.0 1.0
v -1.0 1.0 1.0
v -1.0 1.0 -1.0
v 1.0 -1.0 -1.0
v 1.0 -1.0 1.0
v 1.0 1.0 1.0
v 1.0 1.0 -1.0
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;

export const factoryChimneyModel = `
# chimney vertices (y-axis from 0 to 1 for easy placement)
v 0.4 0.0 0.4
v 0.4 0.0 0.8
v 0.8 0.0 0.8
v 0.8 0.0 0.4
v 0.4 1.0 0.4
v 0.4 1.0 0.8
v 0.8 1.0 0.8
v 0.8 1.0 0.4
# chimney faces (indices re-numbered from 1)
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;