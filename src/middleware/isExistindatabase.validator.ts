import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { getConnection } from "typeorm";

@ValidatorConstraint({ async: true })
export class ExistsInDatabaseConstraint
  implements ValidatorConstraintInterface
{
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [EntityClass, field = "id"] = args.constraints;
    const repository = getConnection().getRepository(EntityClass);
    const record = await repository.findOne({ where: { [field]: value } });
    return !!record;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} ไม่พบในระบบ`;
  }
}

export function ExistsInDatabase(
  entity: Function,
  field = "id",
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, field],
      validator: ExistsInDatabaseConstraint,
    });
  };
}
