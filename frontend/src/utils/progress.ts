import type { ModuleNode } from '../components/SidebarTree';

export function calcModuleProgress(node: ModuleNode): number {
  let done = 0;
  let total = 0;

  const walk = (n: ModuleNode) => {
    if (n.lessons.length) {
      total += n.lessons.length;
      // ⚠️ пока отметка «пройдено» у урока отсутствует
      // позже добавим поле isDone
      done += n.lessons.filter(() => false).length;
    }
    n.children.forEach(walk);
  };

  walk(node);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
