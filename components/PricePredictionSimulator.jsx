import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';

const PricePredictionSimulator = () => {
  const [area, setArea] = useState(0);  // 면적
  const [predictedPrice, setPredictedPrice] = useState(0);  // 예측된 가격

  // 면적 값 변경 처리
  const handleChange = (e) => {
    setArea(e.target.value);
  };

  // 예측 가격 계산 (단순 예시: 면적 * 1000)
  const predictPrice = () => {
    const price = area * 1000;  // 예시로 면적 * 1000으로 가격 계산
    setPredictedPrice(price);
  };

  // 차트 데이터 설정
  const data = {
    labels: ['현재', '예측'],
    datasets: [
      {
        label: '예상 가격',
        data: [0, predictedPrice],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
      <h3>부동산 가격 예측 시뮬레이터</h3>
      <input
        type="number"
        value={area}
        onChange={handleChange}
        placeholder="면적을 입력하세요 (㎡)"
      />
      <button onClick={predictPrice}>가격 예측</button>
      <Line data={data} />
    </div>
  );
};

export default PricePredictionSimulator;
