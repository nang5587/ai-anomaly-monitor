import "../../../style.css";
import truck100 from "../../../
import factory from "../public/images/factory.png";
import icon from "@/public/images/icon.png";
import React from "react";
export default function TruckAnimation() {
  return (
    <div className="scene">
      <img src="/images/factory.png" className="background" />
      <img src="/images/truck100.png" className="truck" id="truck" />
      <img src="/images/icon.png" className="warning" id="warning" />
    </div>
  );
}
