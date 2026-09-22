// Raiz de composicion. Sin routing todavia (Clase 9): una unica vista.
import { Home } from "./pages/Home";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-brand-600 px-6 py-8 text-white">
        <h1 className="text-3xl font-bold">Estudiantes</h1>
        <p className="text-brand-50">Programacion Web Full Stack — UAI 2026</p>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Home />
      </main>
    </div>
  );
}

export default App;
