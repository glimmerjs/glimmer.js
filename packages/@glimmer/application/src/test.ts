import { ComponentCapabilities, ModuleLocator, TemplateLocator } from '@glimmer/interfaces';
import { BundleCompilationResult, CompilerDelegate } from '@glimmer/bundle-compiler';

/**
 * The AppCompilerDelegate extends Glimmer VM's template-oriented
 * CompilerDelegate with additional application-level compilation concerns that
 * support compiling an entire Glimmer.js application into the final JavaScript
 * and bytecode output.
 */
export interface AppCompilerDelegate<Meta> extends CompilerDelegate<Meta> {
  /**
   * Allows the delegate to normalize a path to a module in the project. The
   * value returned from this hook is used as the `module` field in the
   * associated file's ModuleLocator.
   *
   * The meaning of "normalization" is dependent on the particular delegate.
   * Delegates can return the passed absolute path to maintain absolute paths
   * throughout, or they might normalize absolute paths into a path relative to
   * the project root, for example.
   */
  normalizePath(absolutePath: string): string;

  /**
   * Should return a TemplateLocator annotated with additional metadata about the
   * template located at the provided ModuleLocator. Delegates should add
   * additional metadata needed for component or helper resolution, either at
   * compile-time or runtime.
   */
  templateLocatorFor(moduleLocator: ModuleLocator): TemplateLocator<Meta>;

  /**
   * Should return a string of JavaScript source code that serializes the data
   * segment information provided by the compiler. This code should be able to
   * be evaluated in the browser and, together with the bytecode, used by an
   * application loader to fully rehydrate the compiled program on the client.
   */
  generateDataSegment(compilation: BundleCompilationResult): string;
}

export class TestDelegate implements AppCompilerDelegate<any> {
  normalizePath(absolutePath: string): string {
    throw new Error('Method not implemented.');
  }
  templateLocatorFor(moduleLocator: ModuleLocator): TemplateLocator<any> {
    throw new Error('Method not implemented.');
  }
  generateDataSegment(compilation: BundleCompilationResult): string {
    throw new Error('Method not implemented.');
  }
  hasComponentInScope(componentName: string, referrer: any): boolean {
    throw new Error('Method not implemented.');
  }
  resolveComponent(componentName: string, referrer: any): ModuleLocator {
    throw new Error('Method not implemented.');
  }
  getComponentCapabilities(locator: any): ComponentCapabilities {
    throw new Error('Method not implemented.');
  }
  hasHelperInScope(helperName: string, referrer: any): boolean {
    throw new Error('Method not implemented.');
  }
  resolveHelper(helperName: string, referrer: any): ModuleLocator {
    throw new Error('Method not implemented.');
  }
  hasModifierInScope(modifierName: string, referrer: any): boolean {
    throw new Error('Method not implemented.');
  }
  resolveModifier(modifierName: string, referrer: any): ModuleLocator {
    throw new Error('Method not implemented.');
  }
  hasPartialInScope(partialName: string, referrer: any): boolean {
    throw new Error('Method not implemented.');
  }
  resolvePartial(partialName: string, referrer: any): ModuleLocator {
    throw new Error('Method not implemented.');
  }
}
