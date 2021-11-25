import Preact from "preact";

import ProgramMenu from "../components/program-menu";

Preact.render(<ProgramMenu userData={window.userData} programData={window.programData} />, document.getElementById("program-menu"));
