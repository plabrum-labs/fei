import { BrowserRouter, Routes, Route } from "react-router-dom";
import { discoverLectures } from "@/framework/discoverLectures";
import { HomePage } from "@/pages/Home";
import { LecturePage } from "@/pages/LecturePage";
import { SlideDeckPage } from "@/pages/SlideDeckPage";

const lectures = discoverLectures();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage lectures={lectures} />} />
        {lectures
          .filter((lecture) => lecture.loadArticle)
          .map((lecture) => (
            <Route
              key={lecture.path}
              path={`/${lecture.path}`}
              element={<LecturePage lecture={lecture} />}
            />
          ))}
        {lectures
          .filter((lecture) => lecture.loadSlides)
          .map((lecture) => (
            <Route
              key={`${lecture.path}/slides`}
              path={`/${lecture.path}/slides`}
              element={<SlideDeckPage lecture={lecture} />}
            />
          ))}
      </Routes>
    </BrowserRouter>
  );
}
