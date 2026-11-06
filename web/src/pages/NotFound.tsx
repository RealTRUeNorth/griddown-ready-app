import { useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1D1A] gd-grid-bg">
      <div className="text-center">
        <MapPin className="w-10 h-10 text-[#6A6860] mx-auto mb-4" />
        <h1 className="mb-2 text-4xl font-bold text-[#E8E4DC] gd-label">404</h1>
        <p className="mb-6 text-sm text-[#9A9890]">
          Off the map — no route to {location.pathname}
        </p>
        <a href="/" className="text-xs gd-label text-[#E8A04A] underline hover:text-[#D4822A]">
          RETURN TO STATUS
        </a>
      </div>
    </div>
  );
};

export default NotFound;
