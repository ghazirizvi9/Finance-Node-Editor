Instructions for adding prompts from LLM Agent: 

    Delete and Update plans here. WHen a new plan is intiated delete whatever else was in here and start fresh for the new plan to stay updated. (Keep this message attached dont delete it) 
---------------------------------------------------------------------------------
You’re throwing away the old “widget” approach for the three table types and consolidating everything under the parent‑table node, so the canvas version of that node actually looks and behaves like an editable spreadsheet.  
The only file we will touch from now on is the parent‑table node in `src/components/NodeEditor/Nodes/tables/ParentTableNode/ParentTableNode.tsx` – all other table‑related components will be removed.

---

### 1. prune unused code

1. **Delete folders**  
   - `src/components/NodeEditor/Nodes/tables/ChildTableNode`  
   - `src/components/NodeEditor/Nodes/tables/TransactionTableNode`  
   - `src/components/NodeEditor/Nodes/tables/BudgetTableNode`  
2. **Remove imports & wrappers** from `src/components/NodesEditor/index.tsx` and update `nodeTypes` accordingly – only `parentTable` remains under tables.  
3. **Strip definitions** from `NodeLibrary/nodeDefinitions.ts`: drop `transactionTable` & `budgetTable` entries; leave only `parentTable`.  
4. **Eliminate factory cases** for the dropped types and the `createChildTableNode` helper. Update `createNodeFromLibrary` to return just the parent node.  
5. **Erase the `ChildTableNode.tsx` component** entirely from workspace (no longer referenced).  
6. Adjust tests or templates if they mention the removed types.

### 2. extend parent‑table data model

Add new fields to `ParentTableNodeData` in `workflow/types.ts`:

```ts
interface ColumnConfig {
  id: string;
  header: string;
  subheader: string;
  headerColor: string;
  subheaderColor: string;
}

export interface ParentTableNodeData extends BaseFinanceNodeData {
  kind: 'parentTable';
  columns: ColumnConfig[];
  rows: Array<Record<string, string | number>>; // keyed by column id
}
```

(keep existing `rows` usage for backwards compatibility, if desired).

Update any helper types or runtime data accordingly.

### 3. overhaul `ParentTableNode.tsx`

1. **Render an HTML table** inside the node, with:
   * a first row for the table title + big “+” button (eventually removed),
   * a second row for column headers,
   * a third row for sub‑headers,
   * body rows showing the current `data.rows`,
   * a footer row computing totals (numeric columns only).
2. **Editing features**:
   * inputs in header/subheader cells to change names,
   * color pickers next to each header/subheader to choose `headerColor`/`subheaderColor`,
   * inline editing of cell values,
   * buttons to add/remove rows and add/remove columns.
   * whenever the user adds a row, fire the existing `data.onAddRow` callback **automatically** (no plus‑button).
3. **Automatic child‑table creation**:
   * keep `onAddRow`/`onDeleteRow` hooks from `ParentRowRuntimeActions`.
   * in `parentTableOperations.addParentRowAndChildTable`, change the call to generate the child table header/subheader colours based on the new row’s text (e.g. use `getChildTableColors`).
   * the node UI simply calls `data.onAddRow(id, rowName)` when a row is created.  
   * remove any “plus” control; child tables appear as soon as a row is added.
4. **Column configuration UI**:
   * a modal or inline controls to add/edit/delete columns.
   * when a column is removed update every row and recompute totals.
5. **Totals row**: iterate over columns treating numeric‑looking values as numbers and display the sum; leave others blank.

Keep the existing purple “accent” of the parent node, but the table UI now uses the configured header/subheader colors.

### 4. simplify surrounding workflow

* `parentTableOperations.ts` already contains logic for creating child nodes; adjust it to consume the `rowName` and produce a `ChildTableNodeData` that reflects the new header/subheader colors. It can still live in the same file, but orphan the `createChildTableNode` factory or keep it for internal use only.
* Remove `getChildTableColors` if you no longer want it, or keep it for colour generation.
* `workflow/templates.ts` / `factories.ts` should no longer reference the deleted types.

### 5. tidy up UI/UX

* Update `NodeLibrary/index.tsx` to show only “Parent Table” under **Tables**.
* Remove any mention of transactions/budgets in inspector panels, templates, or tests.
* Add documentation comments in `ParentTableNode.tsx` explaining the new table structure.

### 6. verify & test

* Compile with `npx tsc --noEmit` and fix import errors.
* Run `npm run dev`; drag a “Parent Table” node on the canvas and exercise:
  * adding/removing/editing rows
  * adding/removing/editing columns
  * changing header/subheader names & colours
  * totals row updates
  * child table nodes appear automatically with correct headers/colours
* Run lint and any existing unit tests; create new tests if desired (e.g. ensure `addParentRowAndChildTable` uses the row text to set child header).
* Ensure no console warnings/errors in the browser.

---

##### Decisions

* **Only the parent‑table node remains**; other table types are retired entirely.
* **Child table generation stays in workflow code** – UI just calls the hook on row addition.
* **Column configuration and totals** live solely inside `ParentTableNode`; no new components are created for each column type.

The full refactor touches just a handful of files, but it will give you the rich, table‑like parent node you described while keeping the canvas logic neatly organised.
