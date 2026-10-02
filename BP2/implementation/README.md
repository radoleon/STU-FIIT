# A Tool for Variability Management Based on Framed Aspects

### Description
Bachelor's thesis at FIIT STU (*Nástroj pre manažment variability založený na aspektoch v rámcoch*).
One of the promising approaches to variability management in **software product lines** is the
**framed aspects** approach, which combines aspect-oriented programming and frame technology to
increase component reusability through parameterization of cross-cutting concerns. Effective support
reflecting current technologies is however lacking. The result of the thesis is a development
methodology supported by this tool, implemented as a modern single-page web application that processes
projects with XML-annotated source code independently of the implementation language.

### Methodology
The methodology is derived from the common tasks of working with a software product line:

- **Project comprehension** - orientation in an annotated project.
- **Variability configuration** - managing variables, optional features and constraints.
- **Product derivation** - generating a concrete software product from the configuration.
- **Variable code modification** - editing the variable parts of the source code.

### Project Structure
A valid project directory must contain one **specification frame**, one or more **composition frames**
and annotated source files of any type. Supported XML tags are `frame`, `option`, `select`, `set`,
`adapt` and `contrain`. References to variables use the `<@VARIABLE>` syntax.

### Features
- **Loading a project** - pick the project directory and grant write access; invalid XML constructs are
  reported on a parse error page with the file path, message, line and column.
- **Editor** - a file is processed into a sequence of code, text and optional feature blocks. Blocks can
  be edited when their feature is enabled in the configuration, inserted or removed through the context
  menu, previewed as raw code and reverted to the original state.
- **Configuration** - a panel listing missing items (used in the sources but not configured) and unused
  items (configured but not referenced), with editing of variables, optional features and constraints,
  plus configuration statistics and the list of activated frames.
- **Presets** - save the current configuration, then search, apply or delete stored presets. A preset is
  applicable only when it exactly matches the configuration detected in the project.
- **Saving** - only files changed since the last save are written; frames are rewritten every time.
- **Product derivation** - downloads a ZIP archive with all source files with the XML annotations removed
  and variables substituted. Frames and files that end up empty are omitted.
- **Feature model** - generates a tree view of the optional and mandatory modules and their nesting.
- **Documentation** - lists all variables, optional features, constraints and activated frames with their
  references, and exports the result in MD format.

### Setup
Open a terminal in the project folder and run:

```
npm install
npm run dev
```

Requirements: _Node.js_ 18+ and _npm_ 9+.

### Docker
The project contains a `Dockerfile`. To run a local instance, build the image and start the container:

```
docker build -t framed-aspects-tool .
docker run -p 8080:80 framed-aspects-tool
```

### Evaluation
The usability of the solution was verified experimentally by comparison with a manual approach in a
standard development environment. The proposed solution statistically significantly improved results
in tasks related to configuration and product derivation, and to variable code modification.

### Showcase
> Editor

![]()

> Configuration

![]()

> Feature Model

![]()

> Results

![]()

### License
The source code is licensed under the _Apache 2.0_ license.

### Notes
- The thesis text is written in Slovak.
- The source archive is published at https://doi.org/10.6084/m9.figshare.31420682.

### Technologies
![](https://skillicons.dev/icons?i=react,ts,vite,nodejs,docker)
