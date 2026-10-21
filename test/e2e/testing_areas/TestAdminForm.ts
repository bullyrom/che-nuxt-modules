import { expect } from "@playwright/test"

import {
  CANCEL_ACTION,
  CREATE_ACTION,
  EXPECT_TIMEOUT_MS,
  SEARCH_PLACEHOLDER,
} from "../constants"
import { waitForAdminHydration } from "../utils/hydration"

import type { Locator, Page } from "@playwright/test"

/** Page object for the admin create/edit form and its field components. */
class TestAdminForm {
  public readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Closes the form without saving. */
  async cancel(): Promise<void> {
    await this.form()
      .getByRole("button", { exact: true, name: CANCEL_ACTION })
      .click()
    await expect(this.form()).toHaveCount(0)
  }

  /** Picks a file in the form and asserts its name is shown. */
  async chooseFile(
    name: string,
    type: string,
    content: string,
  ): Promise<void> {
    await this.form()
      .locator('input[type="file"]')
      .setInputFiles({ buffer: Buffer.from(content), mimeType: type, name })
    await expect(this.form()).toContainText(name)
  }

  /** Asserts that a field label is not rendered. */
  async expectFieldAbsent(label: string): Promise<void> {
    await expect(
      this.form().locator("label").filter({ hasText: label }),
    ).toHaveCount(0)
  }

  /** Asserts the accepted file type of the form file input. */
  async expectFileAccept(accept: string): Promise<void> {
    await expect(this.form().locator('input[type="file"]')).toHaveAttribute(
      "accept",
      accept,
    )
  }

  /** Asserts the rendered form field labels in order. */
  async expectLabels(labels: string[]): Promise<void> {
    await expect(this.form().locator("label")).toHaveText(labels)
  }

  /** Asserts that the raw-schema fallback is not rendered. */
  async expectNoRawFallback(): Promise<void> {
    await expect(
      this.page.getByText("This schema cannot be rendered as a form."),
    ).toHaveCount(0)
  }

  /** Fills a `date` field and asserts the stored input value. */
  async fillDateField(key: string, value: string): Promise<void> {
    const input = this.fieldRoot(key).locator('input[type="date"]')
    await input.fill(value)
    await expect(input).toHaveValue(value)
  }

  /** Fills a `date-time` field and asserts the stored input value. */
  async fillDateTimeField(key: string, value: string): Promise<void> {
    const input = this.fieldRoot(key).locator('input[type="datetime-local"]')
    await input.fill(value)
    await expect(input).toHaveValue(value)
  }

  /** Opens the create form, retrying until the hydrated page handles it. */
  async openCreate(entityName: string): Promise<void> {
    await waitForAdminHydration(this.page)
    const button = this.page.getByRole("button", {
      exact: true,
      name: CREATE_ACTION,
    })
    const heading = this.page.getByRole("heading", {
      exact: true,
      name: `Create ${entityName}`,
    })
    await expect(button).toBeVisible({ timeout: EXPECT_TIMEOUT_MS })
    await expect
      .poll(async () => {
        if (await heading.isVisible()) return true
        await button.click().catch(() => undefined)
        return heading.isVisible()
      })
      .toBe(true)
  }

  /** Opens a select and returns its root element. */
  async openSelect(placeholder: string): Promise<Locator> {
    const trigger = this.form().getByRole("button", { name: placeholder })
    await expect(trigger).toBeVisible()
    await trigger.click()
    return trigger.locator("..")
  }

  /** Types into a remote select search and returns the resulting request URL. */
  async searchRemoteOptions(
    placeholder: string,
    term: string,
  ): Promise<string> {
    const root = await this.openSelect(placeholder)
    const search = root.getByPlaceholder(SEARCH_PLACEHOLDER)
    await expect(search).toBeVisible()
    const requestPromise = this.page.waitForRequest(
      (request) => new URL(request.url()).searchParams.get("search") === term,
      { timeout: EXPECT_TIMEOUT_MS },
    )
    await search.fill(term)
    const matchedRequest = await requestPromise
    return matchedRequest.url()
  }

  /** Selects the first option loaded by a remote select. */
  async selectFirstRemoteOption(placeholder: string): Promise<string> {
    const root = await this.openSelect(placeholder)
    const options = root.getByRole("button")
    await expect.poll(() => options.count()).toBeGreaterThan(1)
    const option = options.nth(1)
    const optionText = await option.textContent()
    const label = optionText?.replace("✓", "").trim() ?? ""
    await option.click()
    await expect(
      this.form().getByRole("button", { name: label }).first(),
    ).toBeVisible()
    return label
  }

  /** Selects one value in a multi-select field. */
  async selectMultiOption(key: string, optionLabel: string): Promise<void> {
    const root = this.fieldRoot(key)
    const trigger = root.getByRole("button").first()
    await trigger.click()
    const option = root
      .getByRole("button")
      .filter({ hasText: optionLabel })
      .last()
    await expect(option).toBeVisible()
    await option.click()
    await expect(trigger).toContainText(optionLabel)
  }

  /** Selects a static option (for example a track type) by its label. */
  async selectStaticOption(
    placeholder: string,
    optionLabel: string,
  ): Promise<void> {
    const root = await this.openSelect(placeholder)
    const option = root
      .getByRole("button")
      .filter({ hasText: optionLabel })
      .last()
    await expect(option).toBeVisible()
    await option.click()
    await expect(
      this.form().getByRole("button", { name: optionLabel }).first(),
    ).toBeVisible()
  }

  /** Submits the create form and waits for it to close. */
  async submitCreate(): Promise<void> {
    await this.form()
      .getByRole("button", { exact: true, name: "Create" })
      .click()
    await expect(this.form()).toHaveCount(0)
  }

  private fieldRoot(key: string): Locator {
    return this.form().locator("label").filter({ hasText: key }).locator("..")
  }

  private form(): Locator {
    return this.page.locator("form")
  }
}

export { TestAdminForm }
