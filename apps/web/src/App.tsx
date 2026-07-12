import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { discoverLectures } from "@/framework/discoverLectures";
import { LecturePage } from "@/pages/LecturePage";
import { SlideDeckPage } from "@/pages/SlideDeckPage";

const lectures = discoverLectures();

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-3xl px-4 py-12">
              <h1 className="text-3xl font-bold text-blue-600">fei</h1>
              <ul>
                {lectures.map((lecture) => (
                  <li key={lecture.path}>
                    <Link to={`/${lecture.path}`}>{lecture.path}</Link>
                  </li>
                ))}
              </ul>
            </main>
          }
        />
        {lectures.map((lecture) => (
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
