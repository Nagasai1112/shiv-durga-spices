import { useLocation, useNavigate } from "react-router-dom";

export function scrollToStory(behavior = "instant") {
  const section = document.getElementById("story");
  if (!section) return;
  const top = window.scrollY + section.getBoundingClientRect().top - 112;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function HomeLink({ className, children }) {
  const navigate = useNavigate();
  const { pathname, hash, state } = useLocation();

  function onClick(event) {
    event.preventDefault();
    if (pathname !== "/" || hash || state?.scrollTo) {
      navigate("/", { replace: pathname === "/" && !hash, state: null });
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <a href="/" onClick={onClick} className={className}>
      {children}
    </a>
  );
}

export function StoryLink({ className, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function onClick(event) {
    event.preventDefault();
    if (pathname !== "/") {
      navigate("/", { state: { scrollTo: "story" } });
      return;
    }
    scrollToStory("smooth");
  }

  return (
    <a href="/#story" onClick={onClick} className={className}>
      {children}
    </a>
  );
}
