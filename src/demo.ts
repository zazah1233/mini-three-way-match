import { reconcile } from "./reconcile";
import { tomatoPO, tomatoGRN, tomatoInvoice } from "./sampleData";

console.log(JSON.stringify(reconcile(tomatoPO, tomatoGRN, tomatoInvoice), null, 2));