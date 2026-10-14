import clsx from 'clsx'
import { Array, Effect, Layer, Match, Option, Schema, pipe } from 'effect'
import { Calendar, Route, Update } from 'foldkit'
import {
  type HtmlBuilderOf,
  define as defineApplication,
} from 'foldkit/application'
import { Html, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { defineRouteUnion, literal } from 'foldkit/route'
import { modifyFields } from 'foldkit/struct'
import { Url, toString as urlToString } from 'foldkit/url'

import { Nav } from '@foldkit/ui'

import * as Icon from './icon'
import * as Ui from './ui'

// ROUTE

export const ApplicationRoute = defineRouteUnion({
  Home: {},
  Button: {},
  Calendar: {},
  Checkbox: {},
  Combobox: {},
  DatePicker: {},
  Dialog: {},
  Disclosure: {},
  DragAndDrop: {},
  Fieldset: {},
  FileDrop: {},
  HoverIntent: {},
  Input: {},
  Listbox: {},
  Menu: {},
  Meter: {},
  Popover: {},
  Progress: {},
  RadioGroup: {},
  Select: {},
  Slider: {},
  Switch: {},
  Tabs: {},
  Textarea: {},
  Toast: {},
  Tooltip: {},
  Animation: {},
  VirtualList: {},
  NotFound: { path: Schema.String },
})

export type ApplicationRoute = typeof ApplicationRoute.Type

const homeRouter = pipe(Route.root, Route.mapTo(ApplicationRoute.Home))
const buttonRouter = pipe(
  literal('button'),
  Route.mapTo(ApplicationRoute.Button),
)
const calendarRouter = pipe(
  literal('calendar'),
  Route.mapTo(ApplicationRoute.Calendar),
)
const checkboxRouter = pipe(
  literal('checkbox'),
  Route.mapTo(ApplicationRoute.Checkbox),
)
const comboboxRouter = pipe(
  literal('combobox'),
  Route.mapTo(ApplicationRoute.Combobox),
)
const datePickerRouter = pipe(
  literal('date-picker'),
  Route.mapTo(ApplicationRoute.DatePicker),
)
const dialogRouter = pipe(
  literal('dialog'),
  Route.mapTo(ApplicationRoute.Dialog),
)
const disclosureRouter = pipe(
  literal('disclosure'),
  Route.mapTo(ApplicationRoute.Disclosure),
)
const dragAndDropRouter = pipe(
  literal('drag-and-drop'),
  Route.mapTo(ApplicationRoute.DragAndDrop),
)
const fieldsetRouter = pipe(
  literal('fieldset'),
  Route.mapTo(ApplicationRoute.Fieldset),
)
const fileDropRouter = pipe(
  literal('file-drop'),
  Route.mapTo(ApplicationRoute.FileDrop),
)
const hoverIntentRouter = pipe(
  literal('hover-intent'),
  Route.mapTo(ApplicationRoute.HoverIntent),
)
const inputRouter = pipe(literal('input'), Route.mapTo(ApplicationRoute.Input))
const listboxRouter = pipe(
  literal('listbox'),
  Route.mapTo(ApplicationRoute.Listbox),
)
const menuRouter = pipe(literal('menu'), Route.mapTo(ApplicationRoute.Menu))
const meterRouter = pipe(literal('meter'), Route.mapTo(ApplicationRoute.Meter))
const popoverRouter = pipe(
  literal('popover'),
  Route.mapTo(ApplicationRoute.Popover),
)
const progressRouter = pipe(
  literal('progress'),
  Route.mapTo(ApplicationRoute.Progress),
)
const radioGroupRouter = pipe(
  literal('radio-group'),
  Route.mapTo(ApplicationRoute.RadioGroup),
)
const selectRouter = pipe(
  literal('select'),
  Route.mapTo(ApplicationRoute.Select),
)
const sliderRouter = pipe(
  literal('slider'),
  Route.mapTo(ApplicationRoute.Slider),
)
const switchRouter = pipe(
  literal('switch'),
  Route.mapTo(ApplicationRoute.Switch),
)
const tabsRouter = pipe(literal('tabs'), Route.mapTo(ApplicationRoute.Tabs))
const textareaRouter = pipe(
  literal('textarea'),
  Route.mapTo(ApplicationRoute.Textarea),
)
const toastRouter = pipe(literal('toast'), Route.mapTo(ApplicationRoute.Toast))
const tooltipRouter = pipe(
  literal('tooltip'),
  Route.mapTo(ApplicationRoute.Tooltip),
)
const animationRouter = pipe(
  literal('animation'),
  Route.mapTo(ApplicationRoute.Animation),
)
const virtualListRouter = pipe(
  literal('virtual-list'),
  Route.mapTo(ApplicationRoute.VirtualList),
)

const routeParser = Route.oneOf(
  buttonRouter,
  calendarRouter,
  checkboxRouter,
  comboboxRouter,
  datePickerRouter,
  dialogRouter,
  disclosureRouter,
  dragAndDropRouter,
  fieldsetRouter,
  fileDropRouter,
  hoverIntentRouter,
  inputRouter,
  listboxRouter,
  menuRouter,
  meterRouter,
  popoverRouter,
  progressRouter,
  radioGroupRouter,
  selectRouter,
  sliderRouter,
  switchRouter,
  tabsRouter,
  textareaRouter,
  toastRouter,
  tooltipRouter,
  animationRouter,
  virtualListRouter,
  homeRouter,
)

const urlToApplicationRoute = Route.parseUrlWithFallback(
  routeParser,
  ApplicationRoute.NotFound,
)

export const Model = Schema.Struct({
  route: ApplicationRoute,
  uiModel: Ui.Model,
})

export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  ClickedOpenMobileMenu: {},
  GotUiMessage: { message: Ui.Message },
})

export type Message = typeof Message.Type

const ui = Ui.block.connection({
  Model: Model,
  field: 'uiModel',
  parentMessage: Message.GotUiMessage,
})

export const ApplicationDefinition = defineApplication({ Model, Message })

export const Application = ApplicationDefinition.register({
  children: [ui],
})

type ShowcaseHtmlBuilder = HtmlBuilderOf<typeof Application>

const NavigateInternal = Application.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = Application.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const Flags = Schema.Struct({
  today: Calendar.CalendarDate,
})

export type Flags = typeof Flags.Type

export const flags = Effect.gen(function* () {
  const today = yield* Calendar.today.local

  return { today }
})

export const init = (flags: Flags, url: Url) => {
  const uiInit = ui.init(flags.today)

  return {
    model: Model.make({
      route: urlToApplicationRoute(url),
      uiModel: uiInit.model,
    }),
    commands: uiInit.commands,
  }
}

export const update = Application.update((model, message) =>
  Message.match(message, {
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),

    ClickedLink: ({ request }) =>
      UrlRequest.match(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: urlToString(url) })],
        }),
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),

    ChangedUrl: ({ url }) =>
      Update.combine(model, [
        stepModel => ({
          model: modifyFields(stepModel, {
            route: () => urlToApplicationRoute(url),
          }),
        }),
        ui.closeMobileMenu(),
      ]),

    ClickedOpenMobileMenu: () => ui.openMobileMenu()(model),

    GotUiMessage: ({ message }) => ui.fold(model, message),
  }),
)

type NavItem = Readonly<{
  label: string
  routeTag: string
  href: string
}>

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: 'Animation', routeTag: 'Animation', href: animationRouter() },
  { label: 'Button', routeTag: 'Button', href: buttonRouter() },
  { label: 'Calendar', routeTag: 'Calendar', href: calendarRouter() },
  { label: 'Checkbox', routeTag: 'Checkbox', href: checkboxRouter() },
  { label: 'Combobox', routeTag: 'Combobox', href: comboboxRouter() },
  { label: 'Date Picker', routeTag: 'DatePicker', href: datePickerRouter() },
  { label: 'Dialog', routeTag: 'Dialog', href: dialogRouter() },
  { label: 'Disclosure', routeTag: 'Disclosure', href: disclosureRouter() },
  {
    label: 'Drag and Drop',
    routeTag: 'DragAndDrop',
    href: dragAndDropRouter(),
  },
  { label: 'Fieldset', routeTag: 'Fieldset', href: fieldsetRouter() },
  { label: 'File Drop', routeTag: 'FileDrop', href: fileDropRouter() },
  {
    label: 'Hover Intent',
    routeTag: 'HoverIntent',
    href: hoverIntentRouter(),
  },
  { label: 'Input', routeTag: 'Input', href: inputRouter() },
  { label: 'Listbox', routeTag: 'Listbox', href: listboxRouter() },
  { label: 'Menu', routeTag: 'Menu', href: menuRouter() },
  { label: 'Meter', routeTag: 'Meter', href: meterRouter() },
  { label: 'Popover', routeTag: 'Popover', href: popoverRouter() },
  { label: 'Progress', routeTag: 'Progress', href: progressRouter() },
  { label: 'Radio Group', routeTag: 'RadioGroup', href: radioGroupRouter() },
  { label: 'Select', routeTag: 'Select', href: selectRouter() },
  { label: 'Slider', routeTag: 'Slider', href: sliderRouter() },
  { label: 'Switch', routeTag: 'Switch', href: switchRouter() },
  { label: 'Tabs', routeTag: 'Tabs', href: tabsRouter() },
  { label: 'Textarea', routeTag: 'Textarea', href: textareaRouter() },
  { label: 'Toast', routeTag: 'Toast', href: toastRouter() },
  { label: 'Tooltip', routeTag: 'Tooltip', href: tooltipRouter() },
  {
    label: 'Virtual List',
    routeTag: 'VirtualList',
    href: virtualListRouter(),
  },
]

const NAV_ROUTE_TAGS: ReadonlyArray<string> = Array.map(
  NAV_ITEMS,
  navItem => navItem.routeTag,
)

const navItemHref = (index: number): string =>
  pipe(
    NAV_ITEMS,
    Array.get(index),
    Option.map(navItem => navItem.href),
    Option.getOrElse(() => homeRouter()),
  )

const componentNav = (
  currentRoute: ApplicationRoute,
  toView: (render: Nav.RenderInfo) => Html,
): Html =>
  Nav.view({
    items: NAV_ROUTE_TAGS,
    ariaLabel: 'Components',
    toHref: (_routeTag, index) => navItemHref(index),
    isItemCurrent: routeTag => currentRoute._tag === routeTag,
    toView,
  })

const navListView = <Message, AllowedMountRequirements>(
  items: ReadonlyArray<Nav.ItemInfo>,
  linkClassName: (isActive: boolean) => string,
  h: HtmlBuilder<Message, AllowedMountRequirements>,
): Html =>
  h.ul(
    [h.Class('flex flex-col gap-0.5')],
    pipe(
      NAV_ITEMS,
      Array.zip(items),
      Array.map(([navItem, item]) =>
        h.li(
          [],
          [
            h.a(
              [...item.link, h.Class(linkClassName(item.isCurrent))],
              [navItem.label],
            ),
          ],
        ),
      ),
    ),
  )

const navLinkClassName = (isActive: boolean): string =>
  clsx(
    'block px-3 py-1.5 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-accent-100 text-accent-700'
      : 'text-gray-700 hover:bg-gray-200',
  )

const mobileNavLinkClassName = (isActive: boolean): string =>
  clsx(
    'block px-4 py-2.5 rounded-md text-base transition-colors',
    isActive
      ? 'bg-accent-100 text-accent-700'
      : 'text-gray-700 hover:bg-gray-200',
  )

const sidebarView = (
  currentRoute: ApplicationRoute,
  h: ShowcaseHtmlBuilder,
): Html => {
  const sidebarNavView = ({ nav, items }: Nav.RenderInfo): Html =>
    h.nav(
      [
        ...nav,
        h.Class(
          'hidden md:flex w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4 flex-col',
        ),
      ],
      [
        h.div(
          [h.Class('mb-6')],
          [
            h.a(
              [h.Href(homeRouter()), h.Class('block')],
              [
                h.h1(
                  [h.Class('text-lg font-bold text-gray-900')],
                  ['Foldkit UI'],
                ),
              ],
            ),
            h.span([h.Class('text-xs text-gray-500')], ['Component Showcase']),
          ],
        ),
        navListView(items, navLinkClassName, h),
      ],
    )

  return componentNav(currentRoute, sidebarNavView)
}

const mobileMenuContent =
  (
    currentRoute: ApplicationRoute,
  ): Ui.View.MobileMenuViewInputs['renderContent'] =>
  (closeButton, h) => {
    const mobileNavView = ({ nav, items }: Nav.RenderInfo): Html =>
      h.nav(
        [
          ...nav,
          h.Class('flex-1 overflow-y-auto min-h-0 p-4'),
          h.Tabindex(-1),
          h.Autofocus(true),
        ],
        [navListView(items, mobileNavLinkClassName, h)],
      )

    return h.div(
      [h.Class('flex flex-col h-full')],
      [
        h.div(
          [
            h.Class(
              'flex items-center justify-between border-b border-gray-200 px-4 py-3',
            ),
          ],
          [
            h.a(
              [h.Href(homeRouter()), h.Class('block')],
              [
                h.div(
                  [h.Class('flex flex-col')],
                  [
                    h.span(
                      [h.Class('text-base font-bold text-gray-900')],
                      ['Foldkit UI'],
                    ),
                    h.span(
                      [h.Class('text-xs text-gray-500')],
                      ['Component Showcase'],
                    ),
                  ],
                ),
              ],
            ),
            h.button(
              [
                ...closeButton,
                h.Class(
                  'p-2 rounded-md hover:bg-gray-200 transition text-gray-700 cursor-pointer',
                ),
                h.AriaLabel('Close menu'),
              ],
              [Icon.xMark('w-6 h-6')],
            ),
          ],
        ),
        componentNav(currentRoute, mobileNavView),
      ],
    )
  }

const mobileHeaderView = (model: Model, h: ShowcaseHtmlBuilder): Html =>
  h.header(
    [
      h.Class(
        'md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3',
      ),
    ],
    [
      h.a(
        [h.Href(homeRouter()), h.Class('block')],
        [
          h.div(
            [h.Class('flex flex-col')],
            [
              h.span(
                [h.Class('text-base font-bold text-gray-900')],
                ['Foldkit UI'],
              ),
              h.span(
                [h.Class('text-xs text-gray-500')],
                ['Component Showcase'],
              ),
            ],
          ),
        ],
      ),
      h.button(
        [
          h.Class(
            'p-2 rounded-md hover:bg-gray-200 transition text-gray-700 cursor-pointer',
          ),
          h.AriaExpanded(model.uiModel.mobileMenuDialog.isOpen),
          h.AriaLabel('Toggle menu'),
          h.OnClick(Message.ClickedOpenMobileMenu()),
        ],
        [Icon.menu('w-6 h-6')],
      ),
    ],
  )

const mobileMenuView = (model: Model, h: ShowcaseHtmlBuilder): Html =>
  h.block(
    ui.embedView({
      slotId: 'mobile-menu',
      model: model.uiModel,
      view: Ui.View.mobileMenu,
      viewInputs: { renderContent: mobileMenuContent(model.route) },
    }),
  )

const homeView = (h: ShowcaseHtmlBuilder): Html =>
  h.div(
    [h.Class('max-w-2xl')],
    [
      h.h1(
        [h.Class('text-2xl md:text-3xl font-bold text-gray-900 mb-4')],
        ['Foldkit UI Showcase'],
      ),
      h.p(
        [h.Class('text-gray-600 mb-4')],
        [
          'This is a showcase of every Foldkit UI component. Select a component from the menu to see it in action.',
        ],
      ),
      h.p(
        [h.Class('text-gray-600')],
        [
          'Each component is headless. You provide the markup and styling via a callback, and Foldkit handles accessibility, keyboard navigation, and state management.',
        ],
      ),
    ],
  )

const notFoundView = (path: string, h: ShowcaseHtmlBuilder): Html =>
  h.div(
    [h.Class('max-w-2xl')],
    [
      h.h1(
        [h.Class('text-2xl md:text-3xl font-bold text-red-600 mb-4')],
        ['404 — Page Not Found'],
      ),
      h.p(
        [h.Class('text-gray-600 mb-4')],
        [`The path "${path}" was not found.`],
      ),
      h.a(
        [h.Href(homeRouter()), h.Class('text-accent-600 hover:underline')],
        ['Go Home'],
      ),
    ],
  )

const contentView = (model: Model, h: ShowcaseHtmlBuilder): Html => {
  const embedUi = (id: string, view: typeof Ui.View.button): Html =>
    h.block(
      ui.embedView({
        slotId: id,
        model: model.uiModel,
        view,
      }),
    )

  return ApplicationRoute.match(model.route, {
    Home: () => homeView(h),
    Button: () => embedUi('ui-button', Ui.View.button),
    Calendar: () => embedUi('ui-calendar', Ui.View.calendar),
    Checkbox: () => embedUi('ui-checkbox', Ui.View.checkbox),
    Combobox: () => embedUi('ui-combobox', Ui.View.combobox),
    DatePicker: () => embedUi('ui-date-picker', Ui.View.datePicker),
    Dialog: () => embedUi('ui-dialog', Ui.View.dialog),
    Disclosure: () => embedUi('ui-disclosure', Ui.View.disclosure),
    DragAndDrop: () => embedUi('ui-drag-and-drop', Ui.View.dragAndDrop),
    Fieldset: () => embedUi('ui-fieldset', Ui.View.fieldset),
    FileDrop: () => embedUi('ui-file-drop', Ui.View.fileDrop),
    HoverIntent: () => embedUi('ui-hover-intent', Ui.View.hoverIntent),
    Input: () => embedUi('ui-input', Ui.View.input),
    Listbox: () => embedUi('ui-listbox', Ui.View.listbox),
    Menu: () => embedUi('ui-menu', Ui.View.menu),
    Meter: () => embedUi('ui-meter', Ui.View.meter),
    Popover: () => embedUi('ui-popover', Ui.View.popover),
    Progress: () => embedUi('ui-progress', Ui.View.progress),
    RadioGroup: () => embedUi('ui-radio-group', Ui.View.radioGroup),
    Select: () => embedUi('ui-select', Ui.View.select),
    Slider: () => embedUi('ui-slider', Ui.View.slider),
    Switch: () => embedUi('ui-switch', Ui.View.switch_),
    Tabs: () => embedUi('ui-tabs', Ui.View.tabs),
    Textarea: () => embedUi('ui-textarea', Ui.View.textarea),
    Toast: () => embedUi('ui-toast', Ui.View.toast),
    Tooltip: () => embedUi('ui-tooltip', Ui.View.tooltip),
    Animation: () => embedUi('ui-animation', Ui.View.animation),
    VirtualList: () => embedUi('ui-virtual-list', Ui.View.virtualList),
    NotFound: ({ path }) => notFoundView(path, h),
  })
}

const routeTitle = (route: Model['route']): string =>
  Match.value(route).pipe(
    Match.tag('Home', () => 'Foldkit UI Showcase'),
    Match.orElse(({ _tag }) => `${_tag} | Foldkit UI Showcase`),
  )

export const view = Application.view((model, h) => ({
  title: routeTitle(model.route),
  body: h.div(
    [h.Class('flex flex-col md:flex-row min-h-screen bg-white')],
    [
      mobileHeaderView(model, h),
      mobileMenuView(model, h),
      sidebarView(model.route, h),
      h.main(
        [h.Class('flex-1 p-4 md:p-8 overflow-auto')],
        [contentView(model, h)],
      ),
    ],
  ),
}))

export const EffectsLayer = Layer.merge(
  NavigateInternal.layer,
  LoadExternal.layer,
)
