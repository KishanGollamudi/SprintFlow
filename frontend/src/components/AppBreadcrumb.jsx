import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSprints } from "@/context/SprintContext";

const ROUTE_MAP = {
  // Trainer
  "/":                        "Trainer Dashboard",
  "/sprints":                 "Sprints",
  "/create-sprint":           "Create Sprint",
  "/trainer/attendance":      "Attendance List",
  // HR
  "/hr":                      "HR Dashboard",
  "/hr/create-sprint":        "Create Sprint",
  "/hr/sprints":              "Sprints",
  "/hr/cohorts":              "Cohorts",
  // Manager
  "/manager":                 "Manager Dashboard",
  "/manager/employees":       "Employees",
  "/manager/hrbp":            "HR Business Partners",
  "/manager/trainers":        "Trainers",
  "/manager/sprints":         "Sprints",
  // Shared
  "/chat":                    "Chat",
  "/profile":                 "Profile",
};

const AppBreadcrumb = () => {
  const location    = useLocation();
  const { sprints } = useSprints();

  const sprintMatch = location.pathname.match(/^\/sprints\/([^/]+)\/attendance$/);

  if (sprintMatch) {
    const sprint = sprints.find((s) => String(s.id) === sprintMatch[1]);
    const sprintLabel = sprint ? sprint.title : sprintMatch[1];
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/sprints">Sprints</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{sprintLabel}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{ROUTE_MAP[location.pathname] || "Page"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
